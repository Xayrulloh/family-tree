import { Button, Typography } from 'antd';
import * as userModel from '../../users/model'
import { Header } from 'antd/es/layout/layout';
import { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import profile from '../model'
import { Avatar } from 'antd'

export const Home: React.FC = () => {
  const fetchUser = useUnit(userModel.fetchUserFx);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const user = useUnit(userModel.$user);

  const [profileClicked, setProfileClicked] = useState(false);
  const [notificationClicked, setNotificationClicked] = useState(false);

  const { Title, Paragraph } = Typography;

  return (
    <div className="home">
      <Header className='home-header' style={{display: 'flex', background: '0', justifyContent: 'flex-end', alignItems: 'center', padding: '15px', gap: '10px'}}>
        <Button className='notification' style={{color: 'white'}}>Notification</Button>
        <Button className="profile" onClick={() => profile({profileClicked, setProfileClicked})} style={{color: 'white'}}>Profile</Button>
      </Header>
      <main className="home-main" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          {profileClicked && user && <div className="home-profile" style={{backgroundColor: 'green', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column',  height: '600px', width: '600px', borderRadius: '8px', marginTop: '30px'}}>
            <Avatar size={200} src={user.image || ''}/>
            <div style={{marginTop: '40px', paddingTop: '20px'}}>
              <Title style={{color: 'white'}}>Name: {user.name}</Title>
              <Paragraph style={{color: 'white'}}>Email: {user.email}</Paragraph>
              <Paragraph style={{color: 'white'}}>Gender: {user.gender}</Paragraph>
              <Paragraph style={{color: 'white'}}>Birthdate: {user.birthdate || 'UNKNOWN'}</Paragraph>
              <Paragraph style={{color: 'white'}}>Deathdate: {user.deathdate || 'UNKNOWN'}</Paragraph>
            </div>
          </div>}
      </main>
    </div>
  );
};
