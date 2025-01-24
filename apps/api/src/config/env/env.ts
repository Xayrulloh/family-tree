import { registerAs } from '@nestjs/config';

export const env = registerAs('env', () => ({
  DATABASE_URL: process.env.DATABASE_URL!,
  PORT: process.env.PORT!,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  COOKIES_SECRET: process.env.COOKIES_SECRET!
}))