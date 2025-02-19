import * as userModel from '../../users/model'

export const Home: React.FC = () => {
  userModel.usersMeFx()

  return (
    <h1>HOME SWEET HOME</h1>
  );
};
