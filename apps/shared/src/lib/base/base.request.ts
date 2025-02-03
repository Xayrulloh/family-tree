import { z } from 'zod';
import { BaseSchema } from '../schema';

const IdQuerySchema = BaseSchema.pick({ id: true });

type IdQueryType = z.infer<typeof IdQuerySchema>;

export { IdQuerySchema, IdQueryType };
