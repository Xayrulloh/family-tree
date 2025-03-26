import {
  Controller,
  Delete,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger/dist/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { FileUploadResponseSchema, FileDeleteResponseSchema } from '@family-tree/shared';
import { FileUploadParamDto, FileDeleteParamDto, FileUploadResponseDto, FileDeleteResponseDto } from './dto/file.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { ConfigService } from '@nestjs/config';
import { EnvType } from '../../config/env/env-validation';

@ApiTags('File')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService, private readonly configService: ConfigService) {}

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
  @ApiParam({ name: 'folder', required: true, enum: ['avatar', 'tree'] })
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
        })
    )
    file: Express.Multer.File,
    @Param() param: FileUploadParamDto
  ): Promise<FileUploadResponseDto> {
    const key = `${Date.now()}-${file.originalname}`;

    await this.fileService.uploadFile(param.folder, key, file.buffer);

    const path = this.configService.get<EnvType['CLOUDFLARE_URL']>('CLOUDFLARE_URL') as string;

    return { message: 'File uploaded successfully', path: `${path}/${param.folder}/${key}` };
  }

  @Delete(':folder/:key')
  @ApiParam({ name: 'folder', required: true, enum: ['avatar', 'tree'] })
  @ApiParam({ name: 'key', required: true, type: String })
  @ApiOperation({ summary: 'Delete a file from Cloudflare R2' })
  @ApiResponse({ status: 200, description: 'File deleted successfully.' })
  @ApiResponse({ status: 404, description: 'File not found.' })
  @ZodSerializerDto(FileDeleteResponseSchema)
  async deleteFile(@Param() param: FileDeleteParamDto, @Param('key') key: string): Promise<FileDeleteResponseDto> {
    await this.fileService.deleteFile(param.folder, key);

    return { message: 'File deleted successfully' };
  }
}
