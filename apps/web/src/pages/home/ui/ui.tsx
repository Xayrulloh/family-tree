import { Home } from '../../../features/home';
import { factory } from '../model';

const HomePage: React.FC = () => {
  return (
    <div style={{ backgroundImage: "url('../../public/family-tree.jpg')", backgroundSize: 'cover', height: '100vh' }}>
      <Home />
    </div>
  );
};

export const component = HomePage;
export const createModel = factory;
