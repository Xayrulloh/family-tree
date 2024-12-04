import { routes } from '../../../shared/config/routing';
import { createLazyPage } from '../../../shared/lib/lazy-page';
import { withSuspense } from '../../../shared/lib/with-suspense';

const load = () => import('./ui');

const route = routes.browse;

const Page = createLazyPage({
  route,
  load,
});

export const Home = {
  route,
  view: withSuspense(Page),
};
