import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { DrizzleModule } from '../../database/drizzle.module';
import { CloudflareConfig } from '../../config/cloudflare/cloudflare.config';

@Module({
  imports: [DrizzleModule],
  controllers: [FileController],
  providers: [FileService, CloudflareConfig],
})
export class FileModule {}
