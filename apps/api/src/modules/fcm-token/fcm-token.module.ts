import { Module } from '@nestjs/common';
import { FCMTokenService } from './fcm-token.service';
import { FCMTokenController } from './fcm-token.controller';
import { DrizzleModule } from '../../database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [FCMTokenController],
  providers: [FCMTokenService],
})
export class FCMTokenModule {}
