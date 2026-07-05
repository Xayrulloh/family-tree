/// <reference types="jest" />
import { type ExecutionContext, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PublicGuard } from './public.guard';

jest.mock('drizzle-orm', () => ({ eq: jest.fn() }));

jest.mock('~/database/schema', () => ({ familyTreesSchema: {} }));

jest.mock('~/database/drizzle.provider', () => ({
  DrizzleAsyncProvider: 'DrizzleAsyncProvider',
}));

const mockFindFirst = jest.fn();
const mockDb = {
  query: { familyTreesSchema: { findFirst: mockFindFirst } },
};

function createContext(params: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ params }),
    }),
  } as unknown as ExecutionContext;
}

describe('PublicGuard', () => {
  let guard: PublicGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new PublicGuard(mockDb as any);
  });

  it('returns true for a public tree', async () => {
    mockFindFirst.mockResolvedValue({ isPublic: true });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' })),
    ).resolves.toBe(true);
  });

  it('throws NotFoundException when the tree does not exist', async () => {
    mockFindFirst.mockResolvedValue(undefined);

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' })),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException for a private tree — not ForbiddenException, to prevent id probing', async () => {
    mockFindFirst.mockResolvedValue({ isPublic: false });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' })),
    ).rejects.toThrow(NotFoundException);
  });

  it('reads the tree id from params.familyTreeId when present', async () => {
    mockFindFirst.mockResolvedValue({ isPublic: true });

    await expect(
      guard.canActivate(createContext({ familyTreeId: 'tree-1' })),
    ).resolves.toBe(true);
  });

  it('falls back to params.id when familyTreeId is absent', async () => {
    mockFindFirst.mockResolvedValue({ isPublic: true });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' })),
    ).resolves.toBe(true);
  });

  it('prioritizes familyTreeId over id when both are present', async () => {
    mockFindFirst.mockResolvedValue({ isPublic: true });

    await guard.canActivate(
      createContext({ familyTreeId: 'tree-1', id: 'tree-2' }),
    );

    expect(eq).toHaveBeenCalledWith(undefined, 'tree-1');
  });
});
