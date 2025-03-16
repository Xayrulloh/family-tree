import {
  createRoute,
  createRouterControls,
  createHistoryRouter,
} from 'atomic-router';
import { Registration } from '../../pages/registration';

export const routes = {
  browse: createRoute(),
  notFound: createRoute(),
  registration: createRoute()
};

export const routesMap = [
  {
    route: routes.browse,
    path: '/',
  },
  {
    route: routes.notFound,
    path: '/404',
  },
  { 
    path: '/register', 
    route: routes.registration,
  },
];

export const routerControls = createRouterControls();

export const router = createHistoryRouter({
  routes: routesMap,
  controls: routerControls,
  notFoundRoute: routes.notFound,
});
