import { z } from "zod";

const BaseSchema = z.object({
  id: z.string().nonempty(),
  createdAt: z.string().date().nonempty(),
  updatedAt: z.string().date().nonempty(),
  deletedAt: z.string().date().nullable()
})

type BaseSchemaType = z.infer<typeof BaseSchema>;

export { BaseSchema, BaseSchemaType }