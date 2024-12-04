import { Suspense } from 'react';

const WithSuspense = ({ children }: { children: React.ReactNode }) => {
  return <Suspense fallback={"Loading..."}>{children}</Suspense>;
};

export const withSuspense = (Component: React.FC) => {
  return () => (
    <WithSuspense>
      <Component />
    </WithSuspense>
  );
};
