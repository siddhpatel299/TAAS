import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/error.middleware';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

// Encryption utilities
export class PasswordEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SALT_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  // Derive encryption key from user's master key
  static deriveKey(masterKey: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
  }

  // Encrypt sensitive data
  static encrypt(text: string, masterKey: string): { encrypted: string; salt: string; iv: string; tag: string } {
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const key = this.deriveKey(masterKey, salt);
    
    const cipher = crypto.createCipher(this.ALGORITHM, key);
    cipher.setAAD(Buffer.from('password-vault', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: { encrypted: string; salt: string; iv: string; tag: string }, masterKey: string): string {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    const key = this.deriveKey(masterKey, salt);
    
    const decipher = crypto.createDecipher(this.ALGORITHM, key);
    decipher.setAAD(Buffer.from('password-vault', 'utf8'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Generate secure random password
  static generatePassword(options: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilar?: boolean;
  } = {}): string {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = false
    } = options;

    let charset = '';
    
    if (includeLowercase) {
      charset += excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    }
    if (includeUppercase) {
      charset += excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    if (includeNumbers) {
      charset += excludeSimilar ? '23456789' : '0123456789';
    }
    if (includeSymbols) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    if (charset === '') {
      throw new Error('At least one character type must be included');
    }

    let password = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }

    return password;
  }

  // Check password strength
  static checkPasswordStrength(password: string): {
    score: number;
    strength: 'weak' | 'fair' | 'good' | 'strong';
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Use at least 8 characters');
    }

    if (password.length >= 12) {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include uppercase letters');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include numbers');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include special characters');
    }

    // Common patterns penalty
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Avoid repeated characters');
    }

    if (/123|abc|qwe/i.test(password)) {
      score -= 1;
      feedback.push('Avoid common sequences');
    }

    let strength: 'weak' | 'fair' | 'good' | 'strong';
    if (score <= 2) strength = 'weak';
    else if (score <= 4) strength = 'fair';
    else if (score <= 6) strength = 'good';
    else strength = 'strong';

    return { score, strength, feedback };
  }
}

// Interfaces
interface CreatePasswordEntryInput {
  userId: string;
  name: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  tags?: string[];
  customFields?: any;
}

interface UpdatePasswordEntryInput {
  name?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  category?: string;
  tags?: string[];
  isFavorite?: boolean;
  customFields?: any;
}

interface GetPasswordEntriesParams {
  userId: string;
  category?: string;
  search?: string;
  tags?: string[];
  isFavorite?: boolean;
  sortBy?: 'name' | 'createdAt' | 'lastUsedAt' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface CreateCategoryInput {
  userId: string;
  name: string;
  color?: string;
  icon?: string;
}

// Main Service
export const passwordVaultService = {
  // Password Entries
  async getPasswordEntries(params: GetPasswordEntriesParams) {
    const {
      userId,
      category,
      search,
      tags,
      isFavorite,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 50
    } = params;

    const where: Prisma.PasswordEntryWhereInput = {
      userId,
      ...(category && { category }),
      ...(isFavorite !== undefined && { isFavorite }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { url: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(tags && tags.length > 0 && {
        tags: { hasSome: tags }
      })
    };

    const [entries, total] = await Promise.all([
      prisma.passwordEntry.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.passwordEntry.count({ where })
    ]);

    return {
      entries: entries.map(entry => ({
        ...entry,
        password: undefined, // Never return password in list views
        notes: entry.notes ? '***' : null // Hide notes in list views
      })),
      total,
      page,
      limit,
      hasMore: page * limit < total
    };
  },

  async getPasswordEntry(userId: string, id: string, masterKey: string) {
    const entry = await prisma.passwordEntry.findFirst({
      where: { id, userId }
    });

    if (!entry) {
      throw new ApiError('Password entry not found', 404);
    }

    // Decrypt sensitive data
    let decryptedPassword = '';
    let decryptedNotes = null;

    try {
      if (entry.password) {
        const passwordData = JSON.parse(entry.password);
        decryptedPassword = PasswordEncryption.decrypt(passwordData, masterKey);
      }
      
      if (entry.notes) {
        const notesData = JSON.parse(entry.notes);
        decryptedNotes = PasswordEncryption.decrypt(notesData, masterKey);
      }
    } catch (error) {
      throw new ApiError('Failed to decrypt password data. Invalid master key.', 401);
    }

    return {
      ...entry,
      password: decryptedPassword,
      notes: decryptedNotes
    };
  },

  async createPasswordEntry(data: CreatePasswordEntryInput, masterKey: string) {
    // Check password strength
    const strengthCheck = PasswordEncryption.checkPasswordStrength(data.password);
    
    // Encrypt sensitive data
    const encryptedPassword = PasswordEncryption.encrypt(data.password, masterKey);
    const encryptedNotes = data.notes ? PasswordEncryption.encrypt(data.notes, masterKey) : null;

    const entry = await prisma.passwordEntry.create({
      data: {
        userId: data.userId,
        name: data.name,
        username: data.username,
        password: JSON.stringify(encryptedPassword),
        url: data.url,
        notes: encryptedNotes ? JSON.stringify(encryptedNotes) : null,
        category: data.category,
        tags: data.tags || [],
        customFields: data.customFields,
        passwordStrength: strengthCheck.strength
      }
    });

    // Log security event
    await this.logSecurityEvent(data.userId, 'password_created', {
      entryId: entry.id,
      name: data.name,
      strength: strengthCheck.strength
    });

    return {
      ...entry,
      password: undefined,
      notes: data.notes ? '***' : null
    };
  },

  async updatePasswordEntry(userId: string, id: string, data: UpdatePasswordEntryInput, masterKey: string) {
    const existingEntry = await prisma.passwordEntry.findFirst({
      where: { id, userId }
    });

    if (!existingEntry) {
      throw new ApiError('Password entry not found', 404);
    }

    const updateData: any = { ...data };

    // Handle password encryption
    if (data.password) {
      const strengthCheck = PasswordEncryption.checkPasswordStrength(data.password);
      const encryptedPassword = PasswordEncryption.encrypt(data.password, masterKey);
      updateData.password = JSON.stringify(encryptedPassword);
      updateData.passwordStrength = strengthCheck.strength;
    }

    // Handle notes encryption
    if (data.notes !== undefined) {
      if (data.notes) {
        const encryptedNotes = PasswordEncryption.encrypt(data.notes, masterKey);
        updateData.notes = JSON.stringify(encryptedNotes);
      } else {
        updateData.notes = null;
      }
    }

    const entry = await prisma.passwordEntry.update({
      where: { id },
      data: updateData
    });

    // Log security event
    await this.logSecurityEvent(userId, 'password_updated', {
      entryId: entry.id,
      name: entry.name
    });

    return {
      ...entry,
      password: undefined,
      notes: entry.notes ? '***' : null
    };
  },

  async deletePasswordEntry(userId: string, id: string) {
    const entry = await prisma.passwordEntry.findFirst({
      where: { id, userId }
    });

    if (!entry) {
      throw new ApiError('Password entry not found', 404);
    }

    await prisma.passwordEntry.delete({
      where: { id }
    });

    // Log security event
    await this.logSecurityEvent(userId, 'password_deleted', {
      entryId: entry.id,
      name: entry.name
    });

    return { deleted: true };
  },

  async updateLastUsed(userId: string, id: string) {
    await prisma.passwordEntry.updateMany({
      where: { id, userId },
      data: { lastUsedAt: new Date() }
    });

    // Log security event
    await this.logSecurityEvent(userId, 'password_accessed', {
      entryId: id
    });
  },

  // Categories
  async getCategories(userId: string) {
    return await prisma.passwordCategory.findMany({
      where: { userId },
      orderBy: { position: 'asc' }
    });
  },

  async createCategory(data: CreateCategoryInput) {
    // Get max position for ordering
    const maxPosition = await prisma.passwordCategory.findFirst({
      where: { userId: data.userId },
      orderBy: { position: 'desc' }
    });

    return await prisma.passwordCategory.create({
      data: {
        ...data,
        position: (maxPosition?.position || 0) + 1
      }
    });
  },

  async updateCategory(userId: string, id: string, data: Partial<CreateCategoryInput>) {
    const existing = await prisma.passwordCategory.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new ApiError('Category not found', 404);
    }

    return await prisma.passwordCategory.update({
      where: { id },
      data
    });
  },

  async deleteCategory(userId: string, id: string) {
    const existing = await prisma.passwordCategory.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new ApiError('Category not found', 404);
    }

    // Update all passwords in this category to have no category
    await prisma.passwordEntry.updateMany({
      where: { userId, category: existing.name },
      data: { category: null }
    });

    await prisma.passwordCategory.delete({
      where: { id }
    });

    return { deleted: true };
  },

  // Security Events
  async logSecurityEvent(userId: string, eventType: string, metadata?: any, ipAddress?: string, userAgent?: string) {
    await prisma.passwordSecurityEvent.create({
      data: {
        userId,
        eventType,
        metadata,
        ipAddress,
        userAgent
      }
    });
  },

  async getSecurityEvents(userId: string, limit = 50) {
    return await prisma.passwordSecurityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  // Password Generation
  generatePassword(options?: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilar?: boolean;
  }) {
    return PasswordEncryption.generatePassword(options);
  },

  checkPasswordStrength(password: string) {
    return PasswordEncryption.checkPasswordStrength(password);
  },

  // Dashboard Stats
  async getDashboardStats(userId: string) {
    const [
      totalPasswords,
      favoriteCount,
      categoryStats,
      recentEntries,
      weakPasswords
    ] = await Promise.all([
      prisma.passwordEntry.count({ where: { userId } }),
      prisma.passwordEntry.count({ where: { userId, isFavorite: true } }),
      prisma.passwordEntry.groupBy({
        by: ['category'],
        where: { userId, category: { not: null } },
        _count: true
      }),
      prisma.passwordEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          username: true,
          url: true,
          category: true,
          createdAt: true,
          lastUsedAt: true
        }
      }),
      prisma.passwordEntry.count({
        where: { userId, passwordStrength: 'weak' }
      })
    ]);

    return {
      totalPasswords,
      favoriteCount,
      categoryStats: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count
      })),
      recentEntries,
      weakPasswords,
      securityScore: Math.max(0, 100 - (weakPasswords * 10))
    };
  }
};
