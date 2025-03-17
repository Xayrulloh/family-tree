import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { EnvType } from '../env/env-validation';

@Injectable()
export class CloudflareConfig {
  private s3: S3Client;
  private bucketName = 'family-tree';

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      endpoint: configService.get<EnvType['CLOUDFLARE_ENDPOINT']>('CLOUDFLARE_ENDPOINT') as string,
      region: 'auto',
      credentials: {
        accessKeyId: configService.get<EnvType['CLOUDFLARE_ACCESS_KEY_ID']>('CLOUDFLARE_ACCESS_KEY_ID') as string,
        secretAccessKey: configService.get<EnvType['CLOUDFLARE_SECRET_ACCESS_KEY']>(
          'CLOUDFLARE_SECRET_ACCESS_KEY'
        ) as string,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(folder: string, key: string, body: Buffer): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `${folder}/${key}`,
      Body: body,
      ContentType: 'image/jpeg',
    });

    await this.s3.send(command).catch((err) => console.log(err));
  }

  async deleteFile(folder: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: `${folder}/${key}`,
    });

    await this.s3.send(command).catch((err) => console.log(err));
  }
}
