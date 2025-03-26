import { Auth } from '../../../features/auth';
import { factory } from '../model';

const RegistrationPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <Auth />
    </div>
  );
};

export const component = RegistrationPage;
export const createModel = factory;
