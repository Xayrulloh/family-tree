import { Button } from 'antd';
import * as userModel from '../../users/model';
import { Header } from 'antd/es/layout/layout';
import { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import showProfile from '../model';
import { Profile } from '../../profile';

export const Home: React.FC = () => {
  const fetchUser = useUnit(userModel.fetchUserFx);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const user = useUnit(userModel.$user);

  const [profileClicked, setProfileClicked] = useState(false);
  const [notificationClicked, setNotificationClicked] = useState(false);

  return (
    <div className="home">
      <Header
        className="home-header"
        style={{
          display: 'flex',
          background: '0',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '15px',
          gap: '10px',
        }}
      >
        <Button className="notification" style={{ color: 'white' }}>
          Notification
        </Button>
        <Button
          className="profile"
          onClick={() => showProfile({ profileClicked, setProfileClicked })}
          style={{ color: 'white' }}
        >
          Profile
        </Button>
      </Header>
      <main
        className="home-main"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {profileClicked && user && <Profile />}
      </main>
    </div>
  );
};
