import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  TELEGRAM_API_ID: z.string(),
  TELEGRAM_API_HASH: z.string(),
  JWT_SECRET: z.string(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  databaseUrl: parsed.data.DATABASE_URL,
  telegram: {
    apiId: parseInt(parsed.data.TELEGRAM_API_ID, 10),
    apiHash: parsed.data.TELEGRAM_API_HASH,
  },
  jwtSecret: parsed.data.JWT_SECRET,
  frontendUrl: parsed.data.FRONTEND_URL,
  isProduction: parsed.data.NODE_ENV === 'production',
};
