import { z } from "zod";

const BaseSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().date().min(1),
  updatedAt: z.string().date().min(1),
  deletedAt: z.string().date().nullable()
})

type BaseSchemaType = z.infer<typeof BaseSchema>;

export { BaseSchema, BaseSchemaType }