import { createRoute, createRouterControls, createHistoryRouter } from 'atomic-router';

export const routes = {
  browse: createRoute(),
  notFound: createRoute(),
}

export const routesMap = [
  {
    route: routes.browse,
    path: '/',
  },
  {
    route: routes.notFound,
    path: '/404',
  },
]

export const routerControls = createRouterControls();

export const router = createHistoryRouter({
  routes: routesMap,
  controls: routerControls,
  notFoundRoute: routes.notFound,
});