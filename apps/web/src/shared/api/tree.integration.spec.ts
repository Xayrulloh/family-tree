import { describe, expect, it } from 'vitest';
import { recordRequest } from '~/test/request-recorder';
import { tree } from './tree';

describe('tree api client (integration)', () => {
  it('findAll → GET /family-trees with pagination params', async () => {
    const rec = recordRequest();

    await tree.findAll({ page: 1, perPage: 10 });

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/family-trees');

    const params = new URLSearchParams(rec.search);

    expect(params.get('page')).toBe('1');
    expect(params.get('perPage')).toBe('10');
    expect(params.get('name')).toBeNull();
  });

  it('findAll → includes the name filter when provided', async () => {
    const rec = recordRequest();

    await tree.findAll({ page: 2, perPage: 5, name: 'Smith & Jones' });

    const params = new URLSearchParams(rec.search);

    expect(params.get('page')).toBe('2');
    expect(params.get('name')).toBe('Smith & Jones');
  });

  it('findAllPublic → GET /family-trees/public with pagination params', async () => {
    const rec = recordRequest();

    await tree.findAllPublic({ page: 1, perPage: 10 });

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/family-trees/public');

    const params = new URLSearchParams(rec.search);

    expect(params.get('page')).toBe('1');
    expect(params.get('perPage')).toBe('10');
  });

  it('create → POST /family-trees with body', async () => {
    const rec = recordRequest();

    await tree.create({ name: 'Smith Family', image: null, isPublic: false });

    expect(rec.method).toBe('POST');
    expect(rec.pathname).toBe('/family-trees');
    expect(rec.body).toEqual({
      name: 'Smith Family',
      image: null,
      isPublic: false,
    });
  });

  it('update → PUT /family-trees/:id with body', async () => {
    const rec = recordRequest();

    await tree.update('tree-1', { name: 'Renamed', isPublic: true });

    expect(rec.method).toBe('PUT');
    expect(rec.pathname).toBe('/family-trees/tree-1');
    expect(rec.body).toEqual({ name: 'Renamed', isPublic: true });
  });

  it('delete → DELETE /family-trees/:id', async () => {
    const rec = recordRequest();

    await tree.delete('tree-1');

    expect(rec.method).toBe('DELETE');
    expect(rec.pathname).toBe('/family-trees/tree-1');
  });

  it('findById → GET /family-trees/:id', async () => {
    const rec = recordRequest();

    await tree.findById('tree-1');

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/family-trees/tree-1');
  });

  it('findByIdPublic → GET /family-trees/public/:id', async () => {
    const rec = recordRequest();

    await tree.findByIdPublic('tree-1');

    expect(rec.method).toBe('GET');
    expect(rec.pathname).toBe('/family-trees/public/tree-1');
  });
});
