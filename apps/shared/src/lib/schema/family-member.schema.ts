import * as z from 'zod'
import { BaseSchema } from './base.schema'

const FamilyMemberSchema = z.object({
  familyTreeId: z.string().nonempty(),
  userId: z.string().nonempty(),
  parentFamilyTreeId: z.string().nullable(),
  spouseId: z.string().nullable()
}).merge(BaseSchema)

type FamilyMemberSchemaType = z.infer<typeof FamilyMemberSchema>

export { FamilyMemberSchema, FamilyMemberSchemaType }