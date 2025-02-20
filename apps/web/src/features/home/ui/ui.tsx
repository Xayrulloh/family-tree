import { Button } from 'antd';
import * as userModel from '../../users/model'
import { Header } from 'antd/es/layout/layout';

export const Home: React.FC = () => {
  userModel.usersMeFx()

  return (
    <div className="home">
      <Header className='home-header' style={{display: 'flex', background: '0', justifyContent: 'flex-end', alignItems: 'center', padding: '15px', gap: '10px'}}>
        <Button className='notification'>Notification</Button>
        <Button className="profile">Profile</Button>
      </Header>
      <main className="home-main">
        
      </main>
    </div>
  );
};
