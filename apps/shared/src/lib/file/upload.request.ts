import { z } from 'zod';

const FileUploadParamSchema = z.object({
  folder: z.enum(['avatar', 'tree'])
});

const FileDeleteParamSchema = FileUploadParamSchema.extend({
  key: z.string().min(1),
})

type FileUploadParamType = z.infer<typeof FileUploadParamSchema>;
type FileDeleteParamType = z.infer<typeof FileDeleteParamSchema>;

export { FileUploadParamSchema, FileUploadParamType, FileDeleteParamSchema, FileDeleteParamType };
