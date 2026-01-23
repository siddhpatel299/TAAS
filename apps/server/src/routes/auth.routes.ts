import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { TelegramClient } from 'telegram';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { telegramService } from '../services/telegram.service';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router: Router = Router();

// Store pending auth sessions
const pendingAuth = new Map<string, {
  client: TelegramClient;
  phoneCodeHash: string;
  phoneNumber: string;
  expiresAt: number;
}>();

// Request verification code
router.post('/send-code', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new ApiError('Phone number is required', 400);
  }

  const client = await telegramService.createAuthClient();
  const result = await telegramService.sendCode(client, phoneNumber);

  const sessionId = Math.random().toString(36).substring(2);

  pendingAuth.set(sessionId, {
    client,
    phoneCodeHash: result.phoneCodeHash,
    phoneNumber,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  res.json({
    success: true,
    data: {
      sessionId,
      phoneCodeHash: result.phoneCodeHash,
    },
  });
}));

// Verify code and sign in
router.post('/verify-code', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sessionId, code, password } = req.body;

  if (!sessionId || !code) {
    throw new ApiError('Session ID and code are required', 400);
  }

  const session = pendingAuth.get(sessionId);
  if (!session) {
    throw new ApiError('Session expired or invalid', 400);
  }

  if (Date.now() > session.expiresAt) {
    pendingAuth.delete(sessionId);
    throw new ApiError('Session expired', 400);
  }

  try {
    let result;

    try {
      result = await telegramService.signIn(
        session.client,
        session.phoneNumber,
        session.phoneCodeHash,
        code
      );
    } catch (error: any) {
      if (error.message?.includes('SESSION_PASSWORD_NEEDED')) {
        if (!password) {
          return res.json({
            success: true,
            data: {
              requires2FA: true,
              sessionId,
            },
          });
        }
        result = await telegramService.signInWith2FA(session.client, password);
      } else {
        throw error;
      }
    }

    // Get user info
    const me = await telegramService.getMe(session.client);
    const sessionString = telegramService.getSessionString(session.client);

    // Create or update user
    const user = await prisma.user.upsert({
      where: { telegramId: me.id.toString() },
      update: {
        username: me.username || null,
        firstName: me.firstName || null,
        lastName: me.lastName || null,
        phoneNumber: session.phoneNumber,
        sessionData: sessionString,
      },
      create: {
        telegramId: me.id.toString(),
        username: me.username || null,
        firstName: me.firstName || null,
        lastName: me.lastName || null,
        phoneNumber: session.phoneNumber,
        sessionData: sessionString,
      },
    });

    // Check if user has a storage channel, if not create one
    let storageChannel = await prisma.storageChannel.findFirst({
      where: { userId: user.id },
    });

    if (!storageChannel) {
      try {
        const channel = await telegramService.createStorageChannel(session.client);
        storageChannel = await prisma.storageChannel.create({
          data: {
            channelId: channel.id.toString(),
            channelName: 'TAAS Storage',
            userId: user.id,
          },
        });
      } catch (error) {
        console.error('Failed to create storage channel:', error);
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegramId },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    pendingAuth.delete(sessionId);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    throw new ApiError(error.message || 'Authentication failed', 400);
  }
}));

// Get current user
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      telegramId: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      phoneNumber: true,
      timezone: true,
      defaultReminderDays: true,
      defaultReminderTime: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  res.json({
    success: true,
    data: user,
  });
}));

// Update user profile (phone number, timezone, reminder settings)
router.patch('/profile', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumber, timezone, defaultReminderDays, defaultReminderTime } = req.body;

  // Validate phone number format if provided
  if (phoneNumber) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = phoneNumber.replace(/[-()\s]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      throw new ApiError('Invalid phone number format. Please use E.164 format (e.g., +1234567890)', 400);
    }
  }

  // Validate timezone if provided
  const validTimezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London',
    'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney'
  ];
  if (timezone && !validTimezones.includes(timezone)) {
    throw new ApiError('Invalid timezone', 400);
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(timezone !== undefined && { timezone }),
      ...(defaultReminderDays !== undefined && { defaultReminderDays }),
      ...(defaultReminderTime !== undefined && { defaultReminderTime }),
    },
    select: {
      id: true,
      telegramId: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      phoneNumber: true,
      timezone: true,
      defaultReminderDays: true,
      defaultReminderTime: true,
      createdAt: true,
    },
  });

  res.json({
    success: true,
    data: user,
    message: 'Profile updated successfully',
  });
}));

// Get session for browser MTProto client (direct uploads)
// This allows the browser to connect directly to Telegram
router.get('/session', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      sessionData: true,
    },
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  if (!user.sessionData) {
    throw new ApiError('No active Telegram session. Please reconnect.', 400);
  }

  // Get storage channel info
  const storageChannel = await prisma.storageChannel.findFirst({
    where: { userId: user.id },
    select: {
      channelId: true,
      channelName: true,
    },
  });

  res.json({
    success: true,
    data: {
      sessionData: user.sessionData,
      storageChannel: storageChannel ? {
        channelId: storageChannel.channelId,
        channelName: storageChannel.channelName,
      } : null,
    },
  });
}));

// Logout
router.post('/logout', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await telegramService.disconnect(req.user!.id);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}));

// Refresh token
router.post('/refresh', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = jwt.sign(
    { userId: req.user!.id, telegramId: req.user!.telegramId },
    config.jwtSecret,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    data: { token },
  });
}));

// =====================================
// EMAIL/PASSWORD AUTHENTICATION
// =====================================

// Register with email/password
router.post('/register', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    throw new ApiError('Email and password are required', 400);
  }

  if (password.length < 6) {
    throw new ApiError('Password must be at least 6 characters', 400);
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new ApiError('Email already registered', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user without telegramId (they'll link it later)
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, telegramId: null },
    config.jwtSecret,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        hasTelegramLinked: false,
      },
    },
  });
}));

// Login with email/password
router.post('/email-login', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError('Email and password are required', 400);
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.passwordHash) {
    throw new ApiError('Invalid email or password', 401);
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new ApiError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, telegramId: user.telegramId },
    config.jwtSecret,
    { expiresIn: '30d' }
  );

  // Check if user has storage channel
  const storageChannel = await prisma.storageChannel.findFirst({
    where: { userId: user.id },
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        hasTelegramLinked: !!user.telegramId && !!user.sessionData,
      },
      storageChannel: storageChannel ? {
        channelId: storageChannel.channelId,
        channelName: storageChannel.channelName,
      } : null,
    },
  });
}));

// Link Telegram to existing account - Step 1: Send code
router.post('/link-telegram/send-code', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new ApiError('Phone number is required', 400);
  }

  // Check if this phone is already linked to another account
  const existingUser = await prisma.user.findFirst({
    where: {
      phoneNumber,
      id: { not: req.user!.id },
    },
  });

  if (existingUser) {
    throw new ApiError('This phone number is already linked to another account', 400);
  }

  const client = await telegramService.createAuthClient();
  const result = await telegramService.sendCode(client, phoneNumber);

  const sessionId = Math.random().toString(36).substring(2);

  pendingAuth.set(sessionId, {
    client,
    phoneCodeHash: result.phoneCodeHash,
    phoneNumber,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  res.json({
    success: true,
    data: {
      sessionId,
      phoneCodeHash: result.phoneCodeHash,
    },
  });
}));

// Link Telegram to existing account - Step 2: Verify code
router.post('/link-telegram/verify-code', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sessionId, code, password } = req.body;

  if (!sessionId || !code) {
    throw new ApiError('Session ID and code are required', 400);
  }

  const session = pendingAuth.get(sessionId);
  if (!session) {
    throw new ApiError('Session expired or invalid', 400);
  }

  if (Date.now() > session.expiresAt) {
    pendingAuth.delete(sessionId);
    throw new ApiError('Session expired', 400);
  }

  try {
    let result;

    try {
      result = await telegramService.signIn(
        session.client,
        session.phoneNumber,
        session.phoneCodeHash,
        code
      );
    } catch (error: any) {
      if (error.message?.includes('SESSION_PASSWORD_NEEDED')) {
        if (!password) {
          return res.json({
            success: true,
            data: {
              requires2FA: true,
              sessionId,
            },
          });
        }
        result = await telegramService.signInWith2FA(session.client, password);
      } else {
        throw error;
      }
    }

    // Get Telegram user info
    const me = await telegramService.getMe(session.client);
    const sessionString = telegramService.getSessionString(session.client);

    // Check if this telegramId is already linked to another account
    const existingTelegramUser = await prisma.user.findUnique({
      where: { telegramId: me.id.toString() },
    });

    if (existingTelegramUser && existingTelegramUser.id !== req.user!.id) {
      throw new ApiError('This Telegram account is already linked to another user', 400);
    }

    // Update user with Telegram info
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        telegramId: me.id.toString(),
        username: me.username || null,
        phoneNumber: session.phoneNumber,
        sessionData: sessionString,
        // Update name from Telegram if not set
        firstName: req.user!.firstName || me.firstName || null,
        lastName: req.user!.lastName || me.lastName || null,
      },
    });

    // Create storage channel if doesn't exist
    let storageChannel = await prisma.storageChannel.findFirst({
      where: { userId: user.id },
    });

    if (!storageChannel) {
      try {
        const channel = await telegramService.createStorageChannel(session.client);
        storageChannel = await prisma.storageChannel.create({
          data: {
            channelId: channel.id.toString(),
            channelName: 'TAAS Storage',
            userId: user.id,
          },
        });
      } catch (error) {
        console.error('Failed to create storage channel:', error);
      }
    }

    pendingAuth.delete(sessionId);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          hasTelegramLinked: true,
        },
        storageChannel: storageChannel ? {
          channelId: storageChannel.channelId,
          channelName: storageChannel.channelName,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Link Telegram error:', error);
    throw new ApiError(error.message || 'Failed to link Telegram account', 400);
  }
}));

// Add email/password to existing phone account
router.post('/add-email', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError('Email and password are required', 400);
  }

  if (password.length < 6) {
    throw new ApiError('Password must be at least 6 characters', 400);
  }

  // Check if user already has email
  const currentUser = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { email: true },
  });

  if (currentUser?.email) {
    throw new ApiError('Email is already set for this account', 400);
  }

  // Check if email is already taken
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new ApiError('Email is already registered to another account', 400);
  }

  // Hash password and update user
  const passwordHash = await bcrypt.hash(password, 10);

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      email: email.toLowerCase(),
      passwordHash,
    },
    select: {
      id: true,
      telegramId: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  });

  res.json({
    success: true,
    data: {
      user: {
        ...updatedUser,
        hasTelegramLinked: !!updatedUser.telegramId,
        hasEmailLinked: true,
      },
      message: 'Email and password added successfully. You can now login with email.',
    },
  });
}));

export default router;

