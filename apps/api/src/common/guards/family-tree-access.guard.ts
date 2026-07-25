import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '~/database/drizzle.provider';
import * as schema from '~/database/schema';
import type { AuthenticatedRequest } from '~/shared/types/request-with-user';
import { SHARED_TREE_PERMISSION_KEY } from '~/utils/constants';
import type { FamilyTreePermission } from '../decorators/require-permission.decorator';

/**
 * Centralizes owner / public / shared access for any route nested under a
 * family tree (params `familyTreeId` or `id`). Replaces the former
 * `SharedFamilyTreeService.checkAccessSharedFamilyTree` god-method.
 *
 * Must run after `JWTAuthGuard` (relies on `req.user`).
 *
 * NOTE: in Phase 2 the route prefixes (`/`, `/public`, `/shared`) get their own
 * dedicated guards; the three branches below are the seam where that split happens.
 */
@Injectable()
export class FamilyTreeAccessGuard implements CanActivate {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const familyTreeId = request.params.familyTreeId ?? request.params.id;
    const userId = request.user.id;

    const requiredPermissions =
      this.reflector.getAllAndOverride<FamilyTreePermission[]>(
        SHARED_TREE_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    const familyTree = await this.db.query.familyTreesSchema.findFirst({
      where: eq(schema.familyTreesSchema.id, familyTreeId),
      columns: { createdBy: true, isPublic: true },
    });

    if (!familyTree) {
      throw new NotFoundException(
        `Family tree with id ${familyTreeId} not found`,
      );
    }

    // owner: full access
    if (familyTree.createdBy === userId) {
      return true;
    }

    // public: anyone may read, nobody but the owner may write
    if (familyTree.isPublic) {
      if (requiredPermissions.length > 0) {
        throw new ForbiddenException(`You don't have a permission`);
      }

      return true;
    }

    // shared: needs a non-blocked record holding every required flag
    const access = await this.db.query.sharedFamilyTreesSchema.findFirst({
      where: and(
        eq(schema.sharedFamilyTreesSchema.familyTreeId, familyTreeId),
        eq(schema.sharedFamilyTreesSchema.userId, userId),
      ),
      columns: {
        canAddMembers: true,
        canEditMembers: true,
        canDeleteMembers: true,
        isBlocked: true,
      },
    });

    if (!access || access.isBlocked) {
      throw new ForbiddenException(`You don't have a permission`);
    }

    if (requiredPermissions.some((permission) => !access[permission])) {
      throw new ForbiddenException(`You don't have a permission`);
    }

    return true;
  }
}
