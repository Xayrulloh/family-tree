import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { env } from './env';
import { validateEnv } from './env-validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [env],
      isGlobal: true,
      validate: validateEnv,
    }),
  ],
})
export class EnvModule {}
