import { Link } from 'atomic-router-react';
import { factory } from '../model';
import { routes } from '../../../shared/config/routing';

const HomePage: React.FC = () => {
  return (
    <div
      style={{
        // backgroundImage: "url('/family-tree.jpg')",
        backgroundSize: 'cover',
        height: '100vh',
      }}
    >
      <Link to={routes.trees}>Family trees</Link>
    </div>
  );
};

export const component = HomePage;
export const createModel = factory;
