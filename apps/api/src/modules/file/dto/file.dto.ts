import {
  FileUploadParamSchema,
  FileDeleteParamSchema,
  FileUploadResponseSchema,
  FileDeleteResponseSchema,
} from '@family-tree/shared';
import { createZodDto } from 'nestjs-zod';

// request
class FileUploadParamDto extends createZodDto(FileUploadParamSchema) {}
class FileDeleteParamDto extends createZodDto(FileDeleteParamSchema) {}

// response
class FileUploadResponseDto extends createZodDto(FileUploadResponseSchema) {}
class FileDeleteResponseDto extends createZodDto(FileDeleteResponseSchema) {}

export { FileUploadParamDto, FileDeleteParamDto, FileUploadResponseDto, FileDeleteResponseDto };
