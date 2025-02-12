import { Module } from '@nestjs/common';
import { CloudflareConfig } from './cloudflare.config';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [ConfigService],
  exports: [CloudflareConfig],
})
export class CloudflareModule {}
