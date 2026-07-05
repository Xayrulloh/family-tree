import { z } from 'zod';

const dateToString = z.preprocess((val) => {
  if (val == null) return val;
  // Drizzle returns ISO strings (mode:'string') or Date objects from $onUpdate;
  // normalize both to a Z-suffixed ISO string required by z.string().datetime().
  // Invalid inputs pass through unchanged so z.string().datetime() rejects them
  // as a validation failure instead of toISOString() throwing a RangeError.
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? val : val.toISOString();
  }
  if (typeof val === 'string') {
    const date = new Date(val);

    return Number.isNaN(date.getTime()) ? val : date.toISOString();
  }
  return val;
}, z.iso.datetime());

const BaseSchema = z.object({
  id: z.uuid().describe('Primary key'),
  createdAt: dateToString.describe('When it was created'),
  updatedAt: dateToString.describe('When it was last updated'),
  deletedAt: dateToString
    .nullable()
    .describe(
      'When it was soft deleted, but most of the time it is hard deleted',
    ),
});

type BaseSchemaType = z.infer<typeof BaseSchema>;

export { BaseSchema, type BaseSchemaType };
