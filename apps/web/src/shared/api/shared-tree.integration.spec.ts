import { describe, expect, it } from 'vitest';
import { recordRequest } from '~/test/request-recorder';
import { sharedTree } from './shared-tree';

describe('sharedTree api client (integration)', () => {
  it('findAll → GET /family-trees/shared with pagination', async () => {
    const rec = recordRequest();

    await sharedTree.findAll({ page: 1, perPage: 10 });

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/family-trees/shared');

    const params = new URLSearchParams(rec.search);

    expect(params.get('page')).toBe('1');
    expect(params.get('perPage')).toBe('10');
    expect(params.get('name')).toBeNull();
  });

  it('findAll → encodes the name filter when provided', async () => {
    const rec = recordRequest();

    await sharedTree.findAll({ page: 1, perPage: 10, name: 'John & Doe' });

    const params = new URLSearchParams(rec.search);

    expect(params.get('name')).toBe('John & Doe');
  });

  it('findById → GET /family-trees/shared/:familyTreeId', async () => {
    const rec = recordRequest();

    await sharedTree.findById({ familyTreeId: 'tree-1' });

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/family-trees/shared/tree-1');
  });

  it('findUsers → GET /family-trees/shared/:id/users with pagination', async () => {
    const rec = recordRequest();

    await sharedTree.findUsers(
      { familyTreeId: 'tree-1' },
      { page: 2, perPage: 20, name: 'Jane=Smith' },
    );

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/family-trees/shared/tree-1/users');

    const params = new URLSearchParams(rec.search);

    expect(params.get('page')).toBe('2');
    expect(params.get('perPage')).toBe('20');
    expect(params.get('name')).toBe('Jane=Smith');
  });

  it('update → PUT /family-trees/shared/:id/users/:userId with body', async () => {
    const rec = recordRequest();

    await sharedTree.update(
      { familyTreeId: 'tree-1', userId: 'user-9' },
      {
        canAddMembers: true,
        canEditMembers: false,
        canDeleteMembers: false,
        isBlocked: false,
      },
    );

    expect(rec.method).toBe('PUT');
    expect(rec.pathname).toBe('/family-trees/shared/tree-1/users/user-9');
    expect(rec.body).toEqual({
      canAddMembers: true,
      canEditMembers: false,
      canDeleteMembers: false,
      isBlocked: false,
    });
  });
});
