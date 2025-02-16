import { createRoutesView } from 'atomic-router-react';
import { Home } from './home';
import { Registration } from './registration';

export const Routing = createRoutesView({
  routes: [Home, Registration],
});
