import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvType } from '../env/env-validation';

@Injectable()
export class CloudflareConfig {
  private s3: S3Client;
  private cloudflareR2Path: string;
  private bucketName = 'family-tree';

  constructor(configService: ConfigService) {
    this.s3 = new S3Client({
      endpoint: configService.getOrThrow<EnvType['CLOUDFLARE_ENDPOINT']>(
        'CLOUDFLARE_ENDPOINT',
      ),
      region: 'auto',
      credentials: {
        accessKeyId: configService.getOrThrow<
          EnvType['CLOUDFLARE_ACCESS_KEY_ID']
        >('CLOUDFLARE_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<
          EnvType['CLOUDFLARE_SECRET_ACCESS_KEY']
        >('CLOUDFLARE_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: true,
    });
    this.cloudflareR2Path =
      configService.getOrThrow<EnvType['CLOUDFLARE_URL']>('CLOUDFLARE_URL');
  }

  async uploadFile(
    folder: string,
    key: string,
    body: Buffer,
    mimetype: string,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `${folder}/${key}`,
      Body: body,
      ContentType: mimetype,
    });

    await this.s3.send(command).catch((err) => Logger.error(err));
  }

  async deleteFile(path: string): Promise<void> {
    if (path.includes(this.cloudflareR2Path)) {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: path.split(`${this.cloudflareR2Path}/`)[1],
      });

      await this.s3.send(command).catch((err) => Logger.error(err));
    }
  }
}
