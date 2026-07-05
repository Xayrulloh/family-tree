import type { Page } from '@playwright/test';

// Must match VITE_API_URL in playwright.config.ts `webServer.command` —
// page.route() intercepts this fixed API origin, independent of the
// browser baseURL / dev-server port.
export const API_URL = 'http://localhost:9999/api';

export const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  name: 'Test User',
  username: 'testUser',
  image: null,
  gender: 'MALE',
  dob: null,
  dod: null,
  description: null,
  deletedAt: null,
  createdAt: '2020-01-01T00:00:00.000Z',
  updatedAt: '2020-01-01T00:00:00.000Z',
};

export function makeTree(overrides: { id?: string; name?: string } = {}) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000002',
    name: overrides.name ?? 'Test Tree',
    image: null,
    isPublic: false,
    createdBy: mockUser.id,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    deletedAt: null,
  };
}

export function makePaginated(key: string, items: object[]) {
  return {
    page: 1,
    perPage: 15,
    totalCount: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    [key]: items,
  };
}

export async function mockUnauthenticated(page: Page): Promise<void> {
  await page.route(`${API_URL}/users/me`, (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ statusCode: 401, message: 'Unauthorized' }),
    }),
  );
}

export async function mockAuthenticated(page: Page): Promise<void> {
  await page.route(`${API_URL}/users/me`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    }),
  );
}

export function makeMember(
  overrides: { id?: string; name?: string; familyTreeId?: string } = {},
) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000003',
    name: overrides.name ?? 'John Smith',
    image: null,
    gender: 'MALE',
    dob: null,
    dod: null,
    description: null,
    familyTreeId:
      overrides.familyTreeId ?? '00000000-0000-0000-0000-000000000002',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    deletedAt: null,
  };
}

export function makeSharedTree(
  overrides: {
    familyTreeId?: string;
    name?: string;
    canAddMembers?: boolean;
    canEditMembers?: boolean;
    canDeleteMembers?: boolean;
    isBlocked?: boolean;
  } = {},
) {
  return {
    familyTreeId:
      overrides.familyTreeId ?? '00000000-0000-0000-0000-000000000002',
    userId: mockUser.id,
    name: overrides.name ?? 'Shared Tree',
    image: null,
    createdBy: '00000000-0000-0000-0000-000000000009',
    canAddMembers: overrides.canAddMembers ?? false,
    canEditMembers: overrides.canEditMembers ?? false,
    canDeleteMembers: overrides.canDeleteMembers ?? false,
    isBlocked: overrides.isBlocked ?? false,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    deletedAt: null,
  };
}

export function makeSharedUser(
  overrides: {
    userId?: string;
    name?: string;
    email?: string;
    canAddMembers?: boolean;
    isBlocked?: boolean;
  } = {},
) {
  return {
    familyTreeId: '00000000-0000-0000-0000-000000000002',
    userId: overrides.userId ?? '00000000-0000-0000-0000-000000000004',
    name: overrides.name ?? 'Alice Johnson',
    email: overrides.email ?? 'alice@example.com',
    image: null,
    gender: 'FEMALE',
    dob: null,
    dod: null,
    description: null,
    canAddMembers: overrides.canAddMembers ?? true,
    canEditMembers: false,
    canDeleteMembers: false,
    isBlocked: overrides.isBlocked ?? false,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    deletedAt: null,
  };
}
