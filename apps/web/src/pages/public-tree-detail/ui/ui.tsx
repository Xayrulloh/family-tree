import type { FamilyTreeResponseType } from '@family-tree/shared';
import { api } from '~/shared/api';
import type { LazyPageFactoryParams } from '~/shared/lib/lazy-page';
import { createTreeDetailModel } from '~/widgets/tree-visualization';

// PUBLIC view — /public path, read-only, open to anonymous visitors.
export const createModel = ({ route }: LazyPageFactoryParams<{ id: string }>) =>
  createTreeDetailModel<FamilyTreeResponseType>({
    route,
    scope: 'public',
    requireAuth: false,
    fetchTree: (id) => api.tree.findByIdPublic(id),
    resolvePermissions: () => ({
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canManageSharedUsers: false,
    }),
    getName: (tree) => tree.name,
  });

export { TreeDetailView as component } from '~/widgets/tree-visualization';
