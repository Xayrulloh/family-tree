import {
  createRoute,
  createRouterControls,
  createHistoryRouter,
} from 'atomic-router';

export const routes = {
  browse: createRoute(),
  notFound: createRoute(),
  registration: createRoute(),
  trees: createRoute(),
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
  {
    path: '/family-trees',
    route: routes.trees,
  },
];

export const routerControls = createRouterControls();

export const router = createHistoryRouter({
  routes: routesMap,
  controls: routerControls,
  notFoundRoute: routes.notFound,
});
