import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@togodatalab.tg'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 min
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),

  // File Upload
  MAX_FILE_SIZE: z.string().default('10485760').transform(Number), // 10MB
  UPLOAD_DIR: z.string().default('./uploads'),

  // Frontend URL (for emails)
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // 2FA
  TWO_FACTOR_APP_NAME: z.string().default('TogoDataLab Vehicles'),
});

const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(envResult.error.format());
  process.exit(1);
}

export const config = {
  env: envResult.data.NODE_ENV,
  port: envResult.data.PORT,
  database: {
    url: envResult.data.DATABASE_URL,
  },
  jwt: {
    secret: envResult.data.JWT_SECRET,
    expiresIn: envResult.data.JWT_EXPIRES_IN,
    refreshSecret: envResult.data.JWT_REFRESH_SECRET,
    refreshExpiresIn: envResult.data.JWT_REFRESH_EXPIRES_IN,
  },
  cors: {
    origin: envResult.data.CORS_ORIGIN,
  },
  email: {
    host: envResult.data.SMTP_HOST,
    port: envResult.data.SMTP_PORT,
    user: envResult.data.SMTP_USER,
    pass: envResult.data.SMTP_PASS,
    from: envResult.data.SMTP_FROM,
  },
  rateLimit: {
    windowMs: envResult.data.RATE_LIMIT_WINDOW_MS,
    max: envResult.data.RATE_LIMIT_MAX,
  },
  upload: {
    maxFileSize: envResult.data.MAX_FILE_SIZE,
    dir: envResult.data.UPLOAD_DIR,
  },
  frontendUrl: envResult.data.FRONTEND_URL,
  twoFactor: {
    appName: envResult.data.TWO_FACTOR_APP_NAME,
  },
  isDevelopment: envResult.data.NODE_ENV === 'development',
  isProduction: envResult.data.NODE_ENV === 'production',
  isTest: envResult.data.NODE_ENV === 'test',
} as const;
