import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Connection pool optimized for limited database connections (Supabase free tier)
// Using connection_limit=2 to stay well under the pool_size limit
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || '';
  
  // If URL already has connection params, return as-is
  if (url.includes('connection_limit') || url.includes('pool_timeout')) {
    return url;
  }
  
  // Add connection pool params to prevent "max clients reached" error
  // connection_limit=2 is very conservative for free tier
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}connection_limit=2&pool_timeout=10&connect_timeout=10`;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Only log errors in development to reduce noise
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

// Graceful shutdown to release connections
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
