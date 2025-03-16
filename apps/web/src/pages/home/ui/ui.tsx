import { Home } from '../../../features/home';
import { factory } from '../model';

const HomePage: React.FC = () => {
  return (
    <div>
      <Home />
    </div>
  );
};

export const component = HomePage;
export const createModel = factory;
