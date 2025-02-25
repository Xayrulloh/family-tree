import { z } from 'zod';

const FileDeleteResponseSchema = z.object({
  message: z.string().min(1),
});

const FileUploadResponseSchema = z.object({
  message: z.string().min(1),
  key: z.string().min(1),
});

type FileDeleteResponseType = z.infer<typeof FileDeleteResponseSchema>;
type FileUploadResponseType = z.infer<typeof FileUploadResponseSchema>;

export {
  FileDeleteResponseSchema,
  FileDeleteResponseType,
  FileUploadResponseSchema,
  FileUploadResponseType
}