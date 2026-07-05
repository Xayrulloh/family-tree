import type { FamilyTreeSharedResponseType } from '@family-tree/shared';
import { api } from '~/shared/api';
import type { LazyPageFactoryParams } from '~/shared/lib/lazy-page';
import { createTreeDetailModel } from '~/widgets/tree-visualization';

// SHARED view — /shared path, permissions from the RBAC flags on the record.
export const createModel = ({ route }: LazyPageFactoryParams<{ id: string }>) =>
  createTreeDetailModel<FamilyTreeSharedResponseType>({
    route,
    scope: 'shared',
    requireAuth: true,
    fetchTree: (id) => api.sharedTree.findById({ familyTreeId: id }),
    resolvePermissions: (tree) => ({
      canAdd: tree.canAddMembers,
      canEdit: tree.canEditMembers,
      canDelete: tree.canDeleteMembers,
      canManageSharedUsers: false,
    }),
    getName: (tree) => tree.name,
  });

export { TreeDetailView as component } from '~/widgets/tree-visualization';
