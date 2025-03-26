import { base } from './base';

export const file = {
  upload: (category: 'tree', body: FormData) => {
    return base.post<{ path: string; message: string }>(
      `/file/${category}`,
      body
    );
  },
};
