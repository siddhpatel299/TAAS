import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { TelegramClient } from 'telegram';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { telegramService } from '../services/telegram.service';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

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

export default router;
