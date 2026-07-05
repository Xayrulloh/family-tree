import type { FamilyTreeResponseType } from '@family-tree/shared';
import { api } from '~/shared/api';
import type { LazyPageFactoryParams } from '~/shared/lib/lazy-page';
import { createTreeDetailModel } from '~/widgets/tree-visualization';

// OWNER view — bare path, full permissions (server-guarded to the owner).
export const createModel = ({ route }: LazyPageFactoryParams<{ id: string }>) =>
  createTreeDetailModel<FamilyTreeResponseType>({
    route,
    scope: 'owner',
    requireAuth: true,
    fetchTree: (id) => api.tree.findById(id),
    resolvePermissions: () => ({
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canManageSharedUsers: true,
    }),
    getName: (tree) => tree.name,
  });

export { TreeDetailView as component } from '~/widgets/tree-visualization';
