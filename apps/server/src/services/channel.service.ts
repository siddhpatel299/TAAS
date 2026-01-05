/**
 * Channel Service
 * 
 * Manages Telegram storage channels with randomized naming
 * to reduce fingerprinting and avoid detection patterns.
 */

import crypto from 'crypto';
import { TelegramClient, Api } from 'telegram';
import { prisma } from '../lib/prisma';

// Prefixes that look like normal user channels
const CHANNEL_PREFIXES = [
  'MyFiles',
  'CloudDrive', 
  'DataSync',
  'Backup',
  'Storage',
  'Archive',
  'Media',
  'Documents',
  'PersonalCloud',
  'FileVault',
];

// Suffixes that add uniqueness
const generateRandomSuffix = (): string => {
  // Generate a random alphanumeric string that looks human-created
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 4 + Math.floor(Math.random() * 4); // 4-7 chars
  let suffix = '';
  for (let i = 0; i < length; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return suffix;
};

export interface ChannelConfig {
  channelId: string;
  channelName: string;
  accessHash: bigint;
  createdAt: Date;
}

export class ChannelService {
  /**
   * Generate a unique, human-looking channel name
   */
  generateChannelName(userId: string): string {
    // Pick a random prefix
    const prefix = CHANNEL_PREFIXES[Math.floor(Math.random() * CHANNEL_PREFIXES.length)];
    
    // Generate random suffix
    const suffix = generateRandomSuffix();
    
    // Add a hash component for uniqueness (shortened)
    const userHash = crypto.createHash('sha256')
      .update(userId + Date.now().toString())
      .digest('hex')
      .substring(0, 4);
    
    return `${prefix}_${suffix}${userHash}`;
  }

  /**
   * Create a private channel for a user
   */
  async createStorageChannel(
    client: TelegramClient,
    userId: string
  ): Promise<ChannelConfig> {
    const channelName = this.generateChannelName(userId);
    
    // Create private channel
    const result = await client.invoke(
      new Api.channels.CreateChannel({
        title: channelName,
        about: '', // Empty description to reduce fingerprinting
        megagroup: false, // Regular channel, not supergroup
        broadcast: true,
      })
    );

    // Extract channel info
    const updates = result as Api.Updates;
    const channel = updates.chats[0] as Api.Channel;
    
    const channelConfig: ChannelConfig = {
      channelId: channel.id.toString(),
      channelName: channelName,
      accessHash: channel.accessHash!,
      createdAt: new Date(),
    };

    // Store in database
    await prisma.storageChannel.create({
      data: {
        channelId: channelConfig.channelId,
        channelName: channelConfig.channelName,
        userId,
        usedBytes: BigInt(0),
        fileCount: 0,
      },
    });

    return channelConfig;
  }

  /**
   * Get or create a storage channel for a user
   */
  async getOrCreateChannel(
    client: TelegramClient,
    userId: string
  ): Promise<ChannelConfig> {
    // Check for existing channel
    const existing = await prisma.storageChannel.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      // Verify channel still exists on Telegram
      try {
        const entity = await client.getEntity(existing.channelId);
        if (entity) {
          return {
            channelId: existing.channelId,
            channelName: existing.channelName,
            accessHash: BigInt(0), // Will be fetched from entity
            createdAt: existing.createdAt,
          };
        }
      } catch (error) {
        // Channel no longer accessible, create new one
        console.log(`Channel ${existing.channelId} no longer accessible, creating new one`);
      }
    }

    // Create new channel
    return this.createStorageChannel(client, userId);
  }

  /**
   * Rotate channel (create a new one for fresh uploads)
   * Useful for users who want to spread their data
   */
  async rotateChannel(
    client: TelegramClient,
    userId: string
  ): Promise<ChannelConfig> {
    return this.createStorageChannel(client, userId);
  }

  /**
   * Get all channels for a user
   */
  async getUserChannels(userId: string): Promise<ChannelConfig[]> {
    const channels = await prisma.storageChannel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return channels.map(c => ({
      channelId: c.channelId,
      channelName: c.channelName,
      accessHash: BigInt(0),
      createdAt: c.createdAt,
    }));
  }

  /**
   * Update channel statistics
   */
  async updateChannelStats(
    channelId: string,
    userId: string,
    bytesAdded: bigint,
    filesAdded: number
  ): Promise<void> {
    await prisma.storageChannel.update({
      where: {
        channelId_userId: { channelId, userId },
      },
      data: {
        usedBytes: { increment: bytesAdded },
        fileCount: { increment: filesAdded },
      },
    });
  }

  /**
   * Get channel with least usage (for load balancing)
   */
  async getLeastUsedChannel(userId: string): Promise<string | null> {
    const channel = await prisma.storageChannel.findFirst({
      where: { userId },
      orderBy: { usedBytes: 'asc' },
    });

    return channel?.channelId || null;
  }
}

export const channelService = new ChannelService();
