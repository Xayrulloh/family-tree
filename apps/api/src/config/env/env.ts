import { registerAs } from '@nestjs/config';

export const env = registerAs('env', () => ({
  DATABASE_URL: process.env.DATABASE_URL
}))