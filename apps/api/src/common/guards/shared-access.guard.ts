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
 * Access for routes on the `/shared` tree path. Must run after `JWTAuthGuard`.
 * The caller must have a non-blocked `shared_family_trees` record holding every
 * flag declared via `@RequirePermission(...)`. Reads require no flags.
 *
 * Note: the owner does NOT pass here by design — owners use the bare path.
 */
@Injectable()
export class SharedAccessGuard implements CanActivate {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const familyTreeId = request.params.familyTreeId ?? request.params.id;

    const requiredPermissions =
      this.reflector.getAllAndOverride<FamilyTreePermission[]>(
        SHARED_TREE_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    const familyTree = await this.db.query.familyTreesSchema.findFirst({
      where: eq(schema.familyTreesSchema.id, familyTreeId),
      columns: { createdBy: true },
    });

    if (!familyTree) {
      throw new NotFoundException(
        `Family tree with id ${familyTreeId} not found`,
      );
    }

    if (familyTree.createdBy === request.user.id) {
      throw new ForbiddenException(`Owners must use the owner path`);
    }

    const access = await this.db.query.sharedFamilyTreesSchema.findFirst({
      where: and(
        eq(schema.sharedFamilyTreesSchema.familyTreeId, familyTreeId),
        eq(schema.sharedFamilyTreesSchema.userId, request.user.id),
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
