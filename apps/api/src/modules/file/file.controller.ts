import { FileUploadResponseSchema } from '@family-tree/shared';
import {
  Controller,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import type { EnvType } from '~/config/env/env-validation';
import generateRandomString from '~/helpers/random-string.helper';
import { FileUploadParamDto, FileUploadResponseDto } from './dto/file.dto';
import { FileService } from './file.service';
import 'multer';

@ApiTags('File')
@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly configService: ConfigService,
  ) {}

  @Post(':folder')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file to Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    type: 'multipart/form-data',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully.' })
  @ApiResponse({ status: 422, description: 'File type or size not valid.' })
  @ZodSerializerDto(FileUploadResponseSchema)
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /\/(jpe?g|png)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 5000 * 1000,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Param() param: FileUploadParamDto,
  ): Promise<FileUploadResponseDto> {
    const key = generateRandomString(15);

    await this.fileService.uploadFile(
      param.folder,
      key,
      file.buffer,
      file.mimetype,
    );

    const path =
      this.configService.getOrThrow<EnvType['CLOUDFLARE_URL']>(
        'CLOUDFLARE_URL',
      );

    return {
      message: 'File uploaded successfully',
      path: `${path}/${param.folder}/${key}`,
    };
  }
}
