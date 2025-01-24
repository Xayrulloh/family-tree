import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const DrizzleAsyncProvider = 'DrizzleAsyncProvider';

export const drizzleProvider = [
  {
    provide: DrizzleAsyncProvider,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const connectionString = configService.get<string>('DATABASE_URL');
      const pool = new Pool({
        connectionString,
      });

      Logger.log(`Database connected to ${process.env.DATABASE_URL}`);

      return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
    },
  },
];