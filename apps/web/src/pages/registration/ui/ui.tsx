import { factory } from '../model';

import { Button } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useEvent } from 'effector-react';
import { googleLoginFx } from '../../../features/auth/model';

const RegistrationPage = () => {
  const handleGoogleLogin = useEvent(googleLoginFx);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Button
        type="primary"
        icon={<GoogleOutlined />}
        onClick={handleGoogleLogin}
        style={{
          width: '200px', // Square button
          height: '200px',
          borderRadius: '8px', // Optional: Add rounded corners
          fontSize: '18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        Enter using Google
      </Button>
    </div>
  );
};

export const component = RegistrationPage;
export const createModel = factory;
