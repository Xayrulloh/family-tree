import { userModel } from '~/entities/user';
import type { LazyPageFactoryParams } from '~/shared/lib/lazy-page';

export const factory = ({ route }: LazyPageFactoryParams) => {
  userModel.chainAnonymous({ route });

  return {};
};
