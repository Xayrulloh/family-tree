/// <reference types="jest" />
import {
  type ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FamilyTreeAccessGuard } from './family-tree-access.guard';

jest.mock('drizzle-orm', () => ({ and: jest.fn(), eq: jest.fn() }));

jest.mock('~/database/schema', () => ({
  familyTreesSchema: {},
  sharedFamilyTreesSchema: {},
}));

jest.mock('~/database/drizzle.provider', () => ({
  DrizzleAsyncProvider: 'DrizzleAsyncProvider',
}));

const mockTreeFindFirst = jest.fn();
const mockAccessFindFirst = jest.fn();
const mockDb = {
  query: {
    familyTreesSchema: { findFirst: mockTreeFindFirst },
    sharedFamilyTreesSchema: { findFirst: mockAccessFindFirst },
  },
};

const mockReflector = { getAllAndOverride: jest.fn() };

function createContext(
  params: Record<string, string>,
  userId: string,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ params, user: { id: userId } }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

const FULL_ACCESS = {
  isBlocked: false,
  canAddMembers: true,
  canEditMembers: true,
  canDeleteMembers: true,
};

describe('FamilyTreeAccessGuard', () => {
  let guard: FamilyTreeAccessGuard;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReflector.getAllAndOverride.mockReturnValue([]);

    guard = new FamilyTreeAccessGuard(mockDb as any, mockReflector as any);
  });

  it('returns true immediately for the tree owner without a second DB query', async () => {
    mockTreeFindFirst.mockResolvedValue({
      createdBy: 'user-1',
      isPublic: false,
    });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'user-1')),
    ).resolves.toBe(true);

    expect(mockAccessFindFirst).not.toHaveBeenCalled();
  });

  it('returns true for a public tree with no required permissions', async () => {
    mockTreeFindFirst.mockResolvedValue({ createdBy: 'owner', isPublic: true });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'non-owner')),
    ).resolves.toBe(true);

    expect(mockAccessFindFirst).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException for a public tree when required permissions are present', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['canAddMembers']);

    mockTreeFindFirst.mockResolvedValue({ createdBy: 'owner', isPublic: true });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'non-owner')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when the tree does not exist', async () => {
    mockTreeFindFirst.mockResolvedValue(undefined);

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'user-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns true for a valid shared user on a private tree', async () => {
    mockTreeFindFirst.mockResolvedValue({
      createdBy: 'owner',
      isPublic: false,
    });

    mockAccessFindFirst.mockResolvedValue(FULL_ACCESS);

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).resolves.toBe(true);
  });

  it('returns true for a shared user who holds the required permission', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['canEditMembers']);

    mockTreeFindFirst.mockResolvedValue({
      createdBy: 'owner',
      isPublic: false,
    });

    mockAccessFindFirst.mockResolvedValue(FULL_ACCESS);

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).resolves.toBe(true);
  });

  it('throws ForbiddenException when the shared user has no access record', async () => {
    mockTreeFindFirst.mockResolvedValue({
      createdBy: 'owner',
      isPublic: false,
    });

    mockAccessFindFirst.mockResolvedValue(undefined);

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when the shared user is blocked', async () => {
    mockTreeFindFirst.mockResolvedValue({
      createdBy: 'owner',
      isPublic: false,
    });

    mockAccessFindFirst.mockResolvedValue({ ...FULL_ACCESS, isBlocked: true });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when the shared user lacks a required permission', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['canDeleteMembers']);

    mockTreeFindFirst.mockResolvedValue({
      createdBy: 'owner',
      isPublic: false,
    });

    mockAccessFindFirst.mockResolvedValue({
      ...FULL_ACCESS,
      canDeleteMembers: false,
    });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).rejects.toThrow(ForbiddenException);
  });
});
