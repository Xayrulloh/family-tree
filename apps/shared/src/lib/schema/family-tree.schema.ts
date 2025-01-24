import * as z from 'zod'
import { BaseSchema } from './base.schema'

const FamilyTreeSchema = z.object({
  createdBy: z.string().min(1),
  name: z.string().min(1).min(3),
  image: z.string().nullable(),
  visibility: z.boolean().default(false).nullable(),
}).merge(BaseSchema)

type FamilyTreeSchemaType = z.infer<typeof FamilyTreeSchema>

export { FamilyTreeSchema, FamilyTreeSchemaType }