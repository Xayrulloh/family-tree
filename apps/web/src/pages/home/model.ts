import { userModel } from '../../entities/user';
import { LazyPageFactoryParams } from '../../shared/lib/lazy-page';

export const factory = ({ route }: LazyPageFactoryParams) => {
  const authorizedRoute = userModel.chainAuthorized({ route });

  return {};
};
