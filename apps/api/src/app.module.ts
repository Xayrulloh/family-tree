import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DrizzleModule } from './database/drizzle.module';
import { EnvModule } from './config/env/env.module';

@Module({
  imports: [AuthModule, UsersModule, DrizzleModule, EnvModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
