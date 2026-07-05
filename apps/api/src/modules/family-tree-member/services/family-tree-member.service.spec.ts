/// <reference types="jest" />
import { FamilyTreeMemberService } from './family-tree-member.service';

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
  asc: jest.fn(),
  inArray: jest.fn(),
}));

jest.mock('~/database/schema', () => ({
  familyTreeMembersSchema: {},
  familyTreeMemberConnectionsSchema: {},
}));

jest.mock('~/database/drizzle.provider', () => ({
  DrizzleAsyncProvider: 'DrizzleAsyncProvider',
}));

jest.mock('~/config/cloudflare/cloudflare.config', () => ({
  CloudflareConfig: jest.fn(),
}));

jest.mock('@family-tree/shared', () => ({
  FamilyTreeMemberConnectionEnum: { PARENT: 'PARENT', SPOUSE: 'SPOUSE' },
  UserGenderEnum: { MALE: 'MALE', FEMALE: 'FEMALE', UNKNOWN: 'UNKNOWN' },
  generateRandomAvatar: jest.fn(),
}));

const mockConnectionsFindFirst = jest.fn();
const mockConnectionsFindMany = jest.fn();
const mockMembersFindMany = jest.fn();

const mockDb = {
  query: {
    familyTreeMemberConnectionsSchema: {
      findFirst: mockConnectionsFindFirst,
      findMany: mockConnectionsFindMany,
    },
    familyTreeMembersSchema: {
      findMany: mockMembersFindMany,
    },
  },
};

const MEMBER = { id: 'member-1', name: 'Alice' };
const SPOUSE = { id: 'spouse-1', name: 'Bob' };

const SPOUSE_CONN_FROM = {
  fromMemberId: 'member-1',
  toMemberId: 'spouse-1',
  fromMember: MEMBER,
  toMember: SPOUSE,
};

const SPOUSE_CONN_TO = {
  fromMemberId: 'spouse-1',
  toMemberId: 'member-1',
  fromMember: SPOUSE,
  toMember: MEMBER,
};

/**
 * Queue mock responses in the order computeDeletePreview calls them:
 *  1. findMany  → children (PARENT connections FROM member)
 *  2. findFirst → hasParents (PARENT connection TO member)
 *  3. findFirst → spouseConn (SPOUSE connection involving member)
 *  4. findFirst → spouseHasParents (only when spouseConn exists)
 *  5. findMany  → member count sample
 */
function setupMocks({
  children = [] as object[],
  hasParents = undefined as object | undefined,
  spouseConn = undefined as object | undefined,
  spouseHasParents = undefined as object | undefined,
  memberCount = 3,
} = {}) {
  mockConnectionsFindMany.mockResolvedValue(children);

  mockConnectionsFindFirst
    .mockResolvedValueOnce(hasParents)
    .mockResolvedValueOnce(spouseConn);

  if (spouseConn !== undefined) {
    mockConnectionsFindFirst.mockResolvedValueOnce(spouseHasParents);
  }

  mockMembersFindMany.mockResolvedValue(Array(memberCount).fill({}));
}

describe('FamilyTreeMemberService.computeDeletePreview', () => {
  let service: FamilyTreeMemberService;

  beforeEach(() => {
    jest.resetAllMocks();

    service = new FamilyTreeMemberService(
      mockDb as any,
      {} as any,
      { getOrThrow: () => 'https://r2.example.com' } as any,
    );
  });

  const preview = (member = MEMBER, treeId = 'tree-1') =>
    (service as any).computeDeletePreview(member, treeId);

  it('allows deletion of a leaf member with no connections', async () => {
    setupMocks({ memberCount: 3 });

    await expect(preview()).resolves.toEqual({
      canDelete: true,
      blockReason: null,
      spouseToDelete: null,
    });
  });

  it('allows deletion of a top-of-chain member with exactly 1 child', async () => {
    setupMocks({ children: [{}], memberCount: 2 });

    await expect(preview()).resolves.toEqual({
      canDelete: true,
      blockReason: null,
      spouseToDelete: null,
    });
  });

  it('blocks deletion when the member has 2 or more children', async () => {
    setupMocks({ children: [{}, {}] });

    const result = await preview();

    expect(result.canDelete).toBe(false);
    expect(result.blockReason).toMatch(/multiple children/);
    expect(result.spouseToDelete).toBeNull();
  });

  it('blocks deletion of a middle member who has both parents and a child', async () => {
    setupMocks({ children: [{}], hasParents: {} });

    const result = await preview();

    expect(result.canDelete).toBe(false);
    expect(result.blockReason).toMatch(/parents above and children below/);
    expect(result.spouseToDelete).toBeNull();
  });

  it('blocks deletion when the member is the last one in the tree', async () => {
    setupMocks({ memberCount: 1 });

    const result = await preview();

    expect(result.canDelete).toBe(false);
    expect(result.blockReason).toMatch(/last member/);
  });

  it('co-deletes the spouse when the couple has a shared child and 3+ total members', async () => {
    setupMocks({
      children: [{}],
      spouseConn: SPOUSE_CONN_FROM,
      spouseHasParents: undefined,
      memberCount: 3,
    });

    await expect(preview()).resolves.toEqual({
      canDelete: true,
      blockReason: null,
      spouseToDelete: SPOUSE,
    });
  });

  it('falls back to deleting only the target when co-deletion would empty the tree (leaf couple)', async () => {
    setupMocks({
      children: [],
      spouseConn: SPOUSE_CONN_FROM,
      spouseHasParents: undefined,
      memberCount: 2,
    });

    await expect(preview()).resolves.toEqual({
      canDelete: true,
      blockReason: null,
      spouseToDelete: null,
    });
  });

  it('does not co-delete the spouse when spouse has own parents and there are no shared children', async () => {
    setupMocks({
      children: [],
      hasParents: undefined,
      spouseConn: SPOUSE_CONN_FROM,
      spouseHasParents: {},
      memberCount: 3,
    });

    await expect(preview()).resolves.toEqual({
      canDelete: true,
      blockReason: null,
      spouseToDelete: null,
    });
  });

  it('blocks when both the target and the spouse have their own parents', async () => {
    setupMocks({
      children: [],
      hasParents: {},
      spouseConn: SPOUSE_CONN_FROM,
      spouseHasParents: {},
    });

    const result = await preview();

    expect(result.canDelete).toBe(false);
    expect(result.blockReason).toMatch(/spouse has parents/);
    expect(result.spouseToDelete).toBeNull();
  });

  it('blocks when the spouse has parents and the couple has a shared child', async () => {
    setupMocks({
      children: [{}],
      hasParents: undefined,
      spouseConn: SPOUSE_CONN_FROM,
      spouseHasParents: {},
    });

    const result = await preview();

    expect(result.canDelete).toBe(false);
    expect(result.blockReason).toMatch(/spouse has parents/);
    expect(result.spouseToDelete).toBeNull();
  });

  it('resolves potentialSpouse as fromMember when the target is the toMember in the SPOUSE connection', async () => {
    setupMocks({
      spouseConn: SPOUSE_CONN_TO,
      spouseHasParents: undefined,
      memberCount: 3,
    });

    const result = await preview();

    expect(result.canDelete).toBe(true);
    expect(result.spouseToDelete).toEqual(SPOUSE);
  });

  it('allows deletion when exactly 2 members exist and there is no spouse to co-delete', async () => {
    setupMocks({ memberCount: 2 });

    await expect(preview()).resolves.toEqual({
      canDelete: true,
      blockReason: null,
      spouseToDelete: null,
    });
  });
});
