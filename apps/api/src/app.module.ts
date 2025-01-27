import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { EnvModule } from './config/env/env.module';
import { CookiesModule } from './config/cookies/cookies.module';
import { FCMTokenModule } from './modules/fcm-token/fcm-token.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { HttpExceptionFilter } from './common/filters/http.filter';
import { UserModule } from './modules/user/user.module';
import { FamilyTreeModule } from './modules/family-tree/family-tree.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    EnvModule,
    CookiesModule,
    FCMTokenModule,
    FamilyTreeModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
