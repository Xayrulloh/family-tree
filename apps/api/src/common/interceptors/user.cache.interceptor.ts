import type { UserResponseType } from '@family-tree/shared';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, of, tap } from 'rxjs';
import { CacheService } from '../../config/cache/cache.service';

@Injectable()
export class UserCacheInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: CacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<UserResponseType>> {
    const request = context.switchToHttp().getRequest();
    const { method, user, params } = request;
    const path = request.route?.path || request.path || '';

    if (!user) return next.handle();

    // GET requests - Check Cache
    if (method === 'GET') {
      const isMe = path === '/api/users/me';
      const isUserById = path === '/api/users/:id';

      if (isMe || isUserById) {
        const targetId = isMe ? user.id : params.id;

        if (targetId) {
          const cached = await this.cacheService.getUser(targetId);

          if (cached) return of(cached);
        }
      }

      return next.handle().pipe(
        tap(async (data) => {
          if (isMe || isUserById) {
            const targetId = isMe ? user.id : params.id;

            if (targetId) {
              await this.cacheService.setUser(
                targetId,
                data as UserResponseType,
              );
            }
          }
        }),
      );
    }

    // Mutation requests - Invalidate Cache
    const isMutation = ['PUT', 'PATCH'].includes(method);

    if (isMutation && path.includes('/users')) {
      return next.handle().pipe(
        tap(async () => {
          await this.cacheService.cleanUser(user.id);
        }),
      );
    }

    return next.handle();
  }
}
