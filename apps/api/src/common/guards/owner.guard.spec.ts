/// <reference types="jest" />
import {
  type ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { OwnerGuard } from './owner.guard';

jest.mock('drizzle-orm', () => ({ eq: jest.fn() }));

jest.mock('~/database/schema', () => ({ familyTreesSchema: {} }));

jest.mock('~/database/drizzle.provider', () => ({
  DrizzleAsyncProvider: 'DrizzleAsyncProvider',
}));

const mockFindFirst = jest.fn();
const mockDb = {
  query: { familyTreesSchema: { findFirst: mockFindFirst } },
};

function createContext(
  params: Record<string, string>,
  userId: string,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ params, user: { id: userId } }),
    }),
  } as unknown as ExecutionContext;
}

describe('OwnerGuard', () => {
  let guard: OwnerGuard;

  beforeEach(() => {
    jest.clearAllMocks();

    guard = new OwnerGuard(mockDb as any);
  });

  it('returns true when the requesting user is the tree owner', async () => {
    mockFindFirst.mockResolvedValue({ createdBy: 'user-1' });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'user-1')),
    ).resolves.toBe(true);
  });

  it('throws NotFoundException when the tree does not exist', async () => {
    mockFindFirst.mockResolvedValue(undefined);

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'user-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when the user is not the owner', async () => {
    mockFindFirst.mockResolvedValue({ createdBy: 'other-user' });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'user-1')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('reads the tree id from params.familyTreeId when present', async () => {
    mockFindFirst.mockResolvedValue({ createdBy: 'user-1' });

    await expect(
      guard.canActivate(createContext({ familyTreeId: 'tree-1' }, 'user-1')),
    ).resolves.toBe(true);
  });

  it('falls back to params.id when familyTreeId is absent', async () => {
    mockFindFirst.mockResolvedValue({ createdBy: 'user-1' });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'user-1')),
    ).resolves.toBe(true);
  });

  it('prioritises familyTreeId over id when both are present', async () => {
    mockFindFirst.mockResolvedValue({ createdBy: 'user-1' });

    await guard.canActivate(
      createContext({ familyTreeId: 'tree-1', id: 'tree-2' }, 'user-1'),
    );

    expect(eq).toHaveBeenCalledWith(undefined, 'tree-1');
  });
});
