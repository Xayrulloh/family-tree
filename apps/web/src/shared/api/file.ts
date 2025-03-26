import { base } from './base';

export const file = {
  upload: (category: 'tree', body: FormData) => {
    return base.post<{ key: string; message: string }>(
      `/file/${category}`,
      body
    );
  },
};
