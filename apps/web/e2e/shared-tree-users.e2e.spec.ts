import { expect, test } from '@playwright/test';
import {
  API_URL,
  makePaginated,
  makeSharedUser,
  mockAuthenticated,
} from './fixtures';

const TREE_ID = '00000000-0000-0000-0000-000000000002';

test.describe('Shared tree users page (/family-trees/shared/:id/users)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticated(page);
  });

  test('renders the user table with permissions and block action', async ({
    page,
  }) => {
    await page.route(
      `${API_URL}/family-trees/shared/${TREE_ID}/users**`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            makePaginated('sharedFamilyTreeUsers', [
              makeSharedUser({ name: 'Alice Johnson' }),
            ]),
          ),
        }),
    );

    await page.goto(`/family-trees/shared/${TREE_ID}/users`);

    await expect(
      page.getByRole('heading', { name: 'Shared Users' }),
    ).toBeVisible();

    await expect(page.getByText('Alice Johnson')).toBeVisible();
    await expect(page.getByText('alice@example.com')).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Block Access' }),
    ).toBeVisible();
  });

  test('shows a blocked user with the Unblock action', async ({ page }) => {
    await page.route(
      `${API_URL}/family-trees/shared/${TREE_ID}/users**`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            makePaginated('sharedFamilyTreeUsers', [
              makeSharedUser({ name: 'Alice Johnson', isBlocked: true }),
            ]),
          ),
        }),
    );

    await page.goto(`/family-trees/shared/${TREE_ID}/users`);

    await expect(page.getByText('Blocked')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Unblock Access' }),
    ).toBeVisible();
  });

  test('renders the empty state when nobody has access', async ({ page }) => {
    await page.route(
      `${API_URL}/family-trees/shared/${TREE_ID}/users**`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(makePaginated('sharedFamilyTreeUsers', [])),
        }),
    );

    await page.goto(`/family-trees/shared/${TREE_ID}/users`);

    await expect(
      page.getByRole('heading', { name: 'Shared Users' }),
    ).toBeVisible();

    await expect(page.locator('.ant-empty-description')).toHaveText('No data');
  });
});
