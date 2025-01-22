import { appStarted } from "../shared/config/system";
import { router } from '../shared/config/routing';
import { RouterProvider } from 'atomic-router-react';
import './model';
import { Routing } from "../pages";

appStarted();

export const App: React.FC = () => {
  return (
    <RouterProvider router={router}>
      <Routing />
    </RouterProvider>
  )
}