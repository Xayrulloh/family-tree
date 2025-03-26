import { appStarted } from '../shared/config/system';
import { router } from '../shared/config/routing';
import { RouterProvider } from 'atomic-router-react';
import './model';
import { Routing } from '../pages';
import { ConfigProvider } from 'antd';

appStarted();

export const App: React.FC = () => {
  return (
    <ConfigProvider theme={{ token: {  } }}>
      <RouterProvider router={router}>
        <Routing />
      </RouterProvider>
    </ConfigProvider>
  );
};
