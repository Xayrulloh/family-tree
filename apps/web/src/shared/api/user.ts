import { UserResponseType } from '@family-tree/shared';
import { base } from './base';
import { AxiosRequestConfig } from 'axios';

export const user = {
  me: (config?: AxiosRequestConfig) => {
    return base.get<UserResponseType>('/users/me', config);
  },
};
