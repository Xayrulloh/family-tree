import {
  FamilyTreeCreateRequestType,
  FamilyTreeResponseType,
} from '@family-tree/shared';
import { base } from './base';

export const tree = {
  findAll: () => {
    return base.get<FamilyTreeResponseType[]>('/family-trees');
  },
  create: (body: FamilyTreeCreateRequestType) => {
    return base.post('/family-trees', body);
  },
};
