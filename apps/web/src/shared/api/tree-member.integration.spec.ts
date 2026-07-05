import { UserGenderEnum } from '@family-tree/shared';
import { describe, expect, it } from 'vitest';
import { recordRequest } from '~/test/request-recorder';
import { treeMember } from './tree-member';

describe('treeMember api client (integration)', () => {
  describe('scope prefix', () => {
    it('findAll → owner scope has no prefix segment', async () => {
      const rec = recordRequest();

      await treeMember.findAll({ familyTreeId: 'tree-1' });

      expect(rec.method).toBe('GET');
      expect(rec.pathname).toBe('/family-trees/tree-1/members');
    });

    it('findAll → shared scope adds /shared', async () => {
      const rec = recordRequest();

      await treeMember.findAll({ familyTreeId: 'tree-1', scope: 'shared' });

      expect(rec.pathname).toBe('/family-trees/shared/tree-1/members');
    });

    it('findAll → public scope adds /public', async () => {
      const rec = recordRequest();

      await treeMember.findAll({ familyTreeId: 'tree-1', scope: 'public' });

      expect(rec.pathname).toBe('/family-trees/public/tree-1/members');
    });
  });

  it('createChild → POST .../members/child with body', async () => {
    const rec = recordRequest();

    await treeMember.createChild(
      { familyTreeId: 'tree-1' },
      { fromMemberId: 'm-1', gender: UserGenderEnum.MALE },
    );

    expect(rec.method).toBe('POST');
    expect(rec.pathname).toBe('/family-trees/tree-1/members/child');
    expect(rec.body).toEqual({ fromMemberId: 'm-1', gender: 'MALE' });
  });

  it('createSpouse → POST .../members/spouse with body', async () => {
    const rec = recordRequest();

    await treeMember.createSpouse(
      { familyTreeId: 'tree-1' },
      { fromMemberId: 'm-1' },
    );

    expect(rec.method).toBe('POST');
    expect(rec.pathname).toBe('/family-trees/tree-1/members/spouse');
    expect(rec.body).toEqual({ fromMemberId: 'm-1' });
  });

  it('createParents → POST .../members/parents with body', async () => {
    const rec = recordRequest();

    await treeMember.createParents(
      { familyTreeId: 'tree-1' },
      { fromMemberId: 'm-1' },
    );

    expect(rec.method).toBe('POST');
    expect(rec.pathname).toBe('/family-trees/tree-1/members/parents');
    expect(rec.body).toEqual({ fromMemberId: 'm-1' });
  });

  it('update → PUT .../members/:id with body', async () => {
    const rec = recordRequest();

    await treeMember.update(
      { familyTreeId: 'tree-1', id: 'm-1' },
      { name: 'Renamed' },
    );

    expect(rec.method).toBe('PUT');
    expect(rec.pathname).toBe('/family-trees/tree-1/members/m-1');
    expect(rec.body).toEqual({ name: 'Renamed' });
  });

  it('deletePreview → GET .../members/:id/delete-preview', async () => {
    const rec = recordRequest();

    await treeMember.deletePreview({ familyTreeId: 'tree-1', id: 'm-1' });

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe(
      '/family-trees/tree-1/members/m-1/delete-preview',
    );
  });

  it('delete → DELETE .../members/:id', async () => {
    const rec = recordRequest();

    await treeMember.delete({ familyTreeId: 'tree-1', id: 'm-1' });

    expect(rec.method).toBe('DELETE');
    expect(rec.pathname).toBe('/family-trees/tree-1/members/m-1');
  });

  it('findById → GET .../members/:id', async () => {
    const rec = recordRequest();

    await treeMember.findById({ familyTreeId: 'tree-1', id: 'm-1' });

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/family-trees/tree-1/members/m-1');
  });
});
