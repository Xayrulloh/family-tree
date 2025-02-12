import { registerAs } from '@nestjs/config';

export const env = registerAs('env', () => ({
  DATABASE_URL: process.env.DATABASE_URL!,
  PORT: process.env.PORT!,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  COOKIES_SECRET: process.env.COOKIES_SECRET!,
  CLOUDFLARE_URL: process.env.CLOUDFLARE_URL!,
  CLOUDFLARE_ACCESS_KEY_ID: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
  CLOUDFLARE_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  CLOUDFLARE_ENDPOINT: process.env.CLOUDFLARE_ENDPOINT!,
}));
