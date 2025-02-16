import { GoogleOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import * as model from '../model';

export const Auth: React.FC = () => {
  return (
    <Button
      type="primary"
      icon={<GoogleOutlined />}
      onClick={() => model.googleLoginFx()}
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
  );
};
