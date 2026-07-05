import { describe, expect, it } from 'vitest';
import { recordRequest } from '~/test/request-recorder';
import { treeMemberConnection } from './tree-member-connection';

describe('treeMemberConnection api client (integration)', () => {
  it('findAll → GET .../members/connections (owner scope)', async () => {
    const rec = recordRequest();

    await treeMemberConnection.findAll({ familyTreeId: 'tree-1' });

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/family-trees/tree-1/members/connections');
  });

  it('findAll → adds scope prefix when shared', async () => {
    const rec = recordRequest();

    await treeMemberConnection.findAll({
      familyTreeId: 'tree-1',
      scope: 'shared',
    });

    expect(rec.pathname).toBe(
      '/family-trees/shared/tree-1/members/connections',
    );
  });

  it('findById → GET .../members/:memberUserId/connections', async () => {
    const rec = recordRequest();

    await treeMemberConnection.findById({
      familyTreeId: 'tree-1',
      memberUserId: 'm-1',
    });

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/family-trees/tree-1/members/m-1/connections');
  });
});
