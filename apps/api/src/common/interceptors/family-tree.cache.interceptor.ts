import type {
  FamilyTreeMemberConnectionGetAllResponseType,
  FamilyTreeMemberGetAllResponseType,
  FamilyTreePaginationResponseType,
} from '@family-tree/shared';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, of, tap } from 'rxjs';
import { CacheService } from '../../config/cache/cache.service';

// Route paths matched against request.route.path (the template, not the real URL).
// Owner:  /api/family-trees/:familyTreeId/members
// Shared: /api/family-trees/shared/:familyTreeId/members
// Public: /api/family-trees/public/:familyTreeId/members
// All three key the cache by treeId so they share the same cached payload.
const TREES_LIST_PATH = '/api/family-trees';
const MEMBERS_PATH =
  /^\/api\/family-trees\/(?:public\/|shared\/)?:familyTreeId\/members$/;
const CONNECTIONS_PATH =
  /^\/api\/family-trees\/(?:public\/|shared\/)?:familyTreeId\/members\/connections$/;

@Injectable()
export class FamilyTreeCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FamilyTreeCacheInterceptor.name);

  constructor(private readonly cacheService: CacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const { method, user, query, params } = request;
    const treeId = params.familyTreeId || params.id;
    const path = request.route?.path || request.path || '';

    const isTreesList = path === TREES_LIST_PATH;
    const isMembers = MEMBERS_PATH.test(path);
    const isConnections = CONNECTIONS_PATH.test(path);

    // GET requests - Check Cache
    if (method === 'GET') {
      // /family-trees (per-user, owner only — needs an authenticated user)
      if (isTreesList && user) {
        const cached = await this.cacheService.getUserFamilyTrees(
          user.id,
          query,
        );

        if (cached) return of(cached);
      }

      // members list — treeId-keyed, shared across owner/public/shared
      if (isMembers && treeId) {
        const cached = await this.cacheService.getFamilyTreeMembers(treeId);

        if (cached) return of(cached);
      }

      // connections — treeId-keyed, shared across owner/public/shared
      if (isConnections && treeId) {
        const cached =
          await this.cacheService.getFamilyTreeMemberConnections(treeId);

        if (cached) return of(cached);
      }

      return next.handle().pipe(
        tap(async (data) => {
          try {
            if (isTreesList && user) {
              await this.cacheService.setUserFamilyTrees(
                user.id,
                query,
                data as FamilyTreePaginationResponseType,
              );
            } else if (isConnections && treeId) {
              await this.cacheService.setFamilyTreeMemberConnections(
                treeId,
                data as FamilyTreeMemberConnectionGetAllResponseType,
              );
            } else if (isMembers && treeId) {
              await this.cacheService.setFamilyTreeMembers(
                treeId,
                data as FamilyTreeMemberGetAllResponseType,
              );
            }
          } catch (err) {
            this.logger.warn('Cache population failed', err);
          }
        }),
      );
    }

    // Mutations only occur on authenticated (owner/shared) routes
    if (!user) return next.handle();

    // Mutation requests - Invalidate Cache
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    if (isMutation) {
      return next.handle().pipe(
        tap(async () => {
          try {
            const isMemberMutation = path.includes('/members');
            const isConnectionMutation = path.includes('/connections');

            const isDeleteMutation = method === 'DELETE';

            // if tree is deleted. clear cache (tree, members, connection)
            if (
              !isMemberMutation &&
              !isConnectionMutation &&
              isDeleteMutation
            ) {
              await Promise.all([
                this.cacheService.cleanUserFamilyTrees(user.id),
                this.cacheService.cleanFamilyTreeMembers(treeId),
                this.cacheService.cleanFamilyTreeMemberConnections(treeId),
              ]);
            } else if (!isMemberMutation && !isConnectionMutation) {
              // if tree is not deleted but mutated. clear cache (tree)
              await this.cacheService.cleanUserFamilyTrees(user.id);
            } else if (isMemberMutation) {
              // if member is mutated. clear cache (members)
              if (method === 'PUT') {
                await this.cacheService.cleanFamilyTreeMembers(treeId);
              } else {
                // if member is added or deleted. clear cache (members, connections)
                await Promise.all([
                  this.cacheService.cleanFamilyTreeMembers(treeId),
                  this.cacheService.cleanFamilyTreeMemberConnections(treeId),
                ]);
              }
            }
          } catch (err) {
            this.logger.warn('Cache write failed', err);
          }
        }),
      );
    }

    return next.handle();
  }
}
