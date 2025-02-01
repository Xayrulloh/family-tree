import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { validate, ZodDto, ZodSerializationException } from 'nestjs-zod';
import { map, Observable } from 'rxjs';
import { ZodError, ZodSchema } from 'zod';

const REFLECTOR = 'Reflector';

const ZodSerializerDtoOptions = 'ZOD_SERIALIZER_DTO_OPTIONS' as const;

const createZodSerializationException = (error: ZodError) => {
  return new ZodSerializationException(error);
};

@Injectable()
export class ZodSerializerInterceptorCustom implements NestInterceptor {
  constructor(@Inject(REFLECTOR) protected readonly reflector: any) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const responseSchema = this.getContextResponseSchema(context);

    return next.handle().pipe(
      map((res: object | object[]) => {
        if (!responseSchema) return res;
        if (typeof res !== 'object' || res instanceof StreamableFile)
          return res;

        return validate(res, responseSchema, createZodSerializationException);
      })
    );
  }

  protected getContextResponseSchema(
    context: ExecutionContext
  ): ZodDto | ZodSchema | undefined {
    return this.reflector.getAllAndOverride(ZodSerializerDtoOptions, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
}
