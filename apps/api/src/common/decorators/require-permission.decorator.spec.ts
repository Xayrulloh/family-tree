/// <reference types="jest" />
import { Reflector } from '@nestjs/core';
import { SHARED_TREE_PERMISSION_KEY } from '~/utils/constants';
import { RequirePermission } from './require-permission.decorator';

describe('RequirePermission', () => {
  const reflector = new Reflector();

  it('stores a single permission under the shared-tree metadata key', () => {
    class Test {
      @RequirePermission('canAddMembers')
      handler() {}
    }

    const metadata = reflector.get(
      SHARED_TREE_PERMISSION_KEY,
      Test.prototype.handler,
    );

    expect(metadata).toEqual(['canAddMembers']);
  });

  it('stores multiple permissions in order', () => {
    class Test {
      @RequirePermission('canEditMembers', 'canDeleteMembers')
      handler() {}
    }

    const metadata = reflector.get(
      SHARED_TREE_PERMISSION_KEY,
      Test.prototype.handler,
    );

    expect(metadata).toEqual(['canEditMembers', 'canDeleteMembers']);
  });

  it('leaves undecorated routes without metadata (read-only routes)', () => {
    class Test {
      handler() {}
    }

    const metadata = reflector.get(
      SHARED_TREE_PERMISSION_KEY,
      Test.prototype.handler,
    );

    expect(metadata).toBeUndefined();
  });
});
