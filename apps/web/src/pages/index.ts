import { createRoutesView } from 'atomic-router-react';
import { Home } from './home';
import { Registration } from './registration';
import { Trees } from './trees';

export const Routing = createRoutesView({
  routes: [Home, Registration, Trees],
});
