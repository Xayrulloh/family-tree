/// <reference types="jest" />
import {
  type ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SharedAccessGuard } from './shared-access.guard';

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

describe('SharedAccessGuard', () => {
  let guard: SharedAccessGuard;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReflector.getAllAndOverride.mockReturnValue([]);

    guard = new SharedAccessGuard(mockDb as any, mockReflector as any);
  });

  it('returns true for a valid shared user with no required permissions', async () => {
    mockTreeFindFirst.mockResolvedValue({ createdBy: 'owner' });

    mockAccessFindFirst.mockResolvedValue(FULL_ACCESS);

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).resolves.toBe(true);
  });

  it('returns true when the user holds the required permission', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['canAddMembers']);

    mockTreeFindFirst.mockResolvedValue({ createdBy: 'owner' });

    mockAccessFindFirst.mockResolvedValue(FULL_ACCESS);

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).resolves.toBe(true);
  });

  it('throws NotFoundException when the tree does not exist', async () => {
    mockTreeFindFirst.mockResolvedValue(undefined);

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when the caller is the tree owner — owners must use the owner path', async () => {
    mockTreeFindFirst.mockResolvedValue({ createdBy: 'user-1' });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'user-1')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when the user has no shared access record', async () => {
    mockTreeFindFirst.mockResolvedValue({ createdBy: 'owner' });

    mockAccessFindFirst.mockResolvedValue(undefined);

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when the user is blocked', async () => {
    mockTreeFindFirst.mockResolvedValue({ createdBy: 'owner' });

    mockAccessFindFirst.mockResolvedValue({ ...FULL_ACCESS, isBlocked: true });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when the user lacks a required permission', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['canDeleteMembers']);

    mockTreeFindFirst.mockResolvedValue({ createdBy: 'owner' });

    mockAccessFindFirst.mockResolvedValue({
      ...FULL_ACCESS,
      canDeleteMembers: false,
    });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when any one of multiple required permissions is missing', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      'canAddMembers',
      'canEditMembers',
    ]);

    mockTreeFindFirst.mockResolvedValue({ createdBy: 'owner' });

    mockAccessFindFirst.mockResolvedValue({
      ...FULL_ACCESS,
      canEditMembers: false,
    });

    await expect(
      guard.canActivate(createContext({ id: 'tree-1' }, 'shared-user')),
    ).rejects.toThrow(ForbiddenException);
  });
});
