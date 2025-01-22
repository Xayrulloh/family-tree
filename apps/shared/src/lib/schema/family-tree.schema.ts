import * as z from 'zod'
import { BaseSchema } from './base.schema'

const FamilyTreeSchema = z.object({
  createdBy: z.string().nonempty(),
  name: z.string().nonempty().min(3),
  image: z.string().nullable(),
  visibility: z.boolean().default(false).nullable(),
}).merge(BaseSchema)

type FamilyTreeSchemaType = z.infer<typeof FamilyTreeSchema>

export { FamilyTreeSchema, FamilyTreeSchemaType }