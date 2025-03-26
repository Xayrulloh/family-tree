import { createEffect, createStore, sample } from 'effector';
import { userModel } from '../../entities/user';
import { LazyPageFactoryParams } from '../../shared/lib/lazy-page';
import { api } from '../../shared/api';
import { FamilyTreeSchemaType } from '@family-tree/shared';

export const factory = ({ route }: LazyPageFactoryParams) => {
  const authorizedRoute = userModel.chainAuthorized({ route });

  const $trees = createStore<FamilyTreeSchemaType[]>([]);

  const fetchTreesFx = createEffect(() => api.tree.findAll());
  const $treesFetching = fetchTreesFx.pending;

  sample({
    clock: authorizedRoute.opened,
    target: fetchTreesFx,
  });

  sample({
    clock: fetchTreesFx.doneData,
    fn: (response) => response.data,
    target: $trees,
  });

  return {
    $trees,
    $treesFetching,
  };
};
