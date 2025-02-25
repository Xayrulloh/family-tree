import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env/env';
import cookieParser from 'cookie-parser';
import { GLOBAL_PREFIX } from './utils/constants';
import SwaggerBuilder from './config/swagger/swagger.config';
import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.use(cookieParser());
  app.use(
    cors({
      origin: 'http://localhost:4200',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: 'Content-Type, Authorization',
      credentials: true,
    })
  );

  const port = env().PORT;

  // swagger
  SwaggerBuilder.make(app);

  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${GLOBAL_PREFIX}`
  );
}

bootstrap();
