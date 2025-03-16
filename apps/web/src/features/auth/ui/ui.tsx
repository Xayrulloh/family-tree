import { GoogleOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import * as model from '../model';

export const Auth: React.FC = () => {
  return (
    <div
      className="auth"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50%',
        width: '50%',
        backgroundColor: 'gray',
        borderRadius: '8px',
      }}
    >
      <Button
        type="primary"
        icon={<GoogleOutlined />}
        onClick={() => model.googleLoginFx()}
        style={{
          width: '200px',
          height: '50px',
          borderRadius: '8px',
          fontSize: '18px',
          backgroundColor: 'red',
        }}
      >
        Enter using Google
      </Button>
    </div>
  );
};
