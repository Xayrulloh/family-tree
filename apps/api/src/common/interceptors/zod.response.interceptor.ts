import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationInterceptor<T> implements NestInterceptor {
  constructor(private schema: ZodSchema<T>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    return next.handle().pipe(
      map((data) => {
        const result = this.schema.safeParse(data);

        if (!result.success) {
          Logger.error(result.error);

          throw new InternalServerErrorException('Oops something went wrong');
        }

        return result.data;
      })
    );
  }
}
