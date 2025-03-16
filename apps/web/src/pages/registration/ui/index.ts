import { routes } from '../../../shared/config/routing';
import { createLazyPage } from '../../../shared/lib/lazy-page';
import { withSuspense } from '../../../shared/lib/with-suspense';

const load = () => import('./ui');

const route = routes.registration;

const Page = createLazyPage({
  route,
  load,
});

export const Registration = {
  route,
  view: withSuspense(Page),
};
