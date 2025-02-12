import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DrizzleModule } from '../../database/drizzle.module';
import { CloudflareConfig } from '../../config/cloudflare/cloudflare.config';

@Module({
  imports: [DrizzleModule],
  controllers: [UserController],
  providers: [UserService, CloudflareConfig],
})
export class UserModule {}
