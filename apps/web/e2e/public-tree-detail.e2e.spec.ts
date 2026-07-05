import { expect, test } from '@playwright/test';
import { API_URL, makeMember, makeTree, mockUnauthenticated } from './fixtures';

const TREE_ID = '00000000-0000-0000-0000-000000000002';

test.describe('Public tree detail page (/family-trees/public/:id)', () => {
  test.beforeEach(async ({ page }) => {
    // Public detail requires no session — anonymous visitors can view it.
    await mockUnauthenticated(page);

    await page.route(`${API_URL}/family-trees/public/${TREE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeTree({ id: TREE_ID, name: 'Public Tree' })),
      }),
    );

    await page.route(
      `${API_URL}/family-trees/public/${TREE_ID}/members`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            makeMember({ name: 'Ada Lovelace', familyTreeId: TREE_ID }),
          ]),
        }),
    );

    await page.route(
      `${API_URL}/family-trees/public/${TREE_ID}/members/connections`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        }),
    );
  });

  test('renders for an anonymous visitor without redirecting to /register', async ({
    page,
  }) => {
    await page.goto(`/family-trees/public/${TREE_ID}`);

    await expect(page.locator('#FamilyChart')).toBeVisible();
    await expect(page.getByText('Ada Lovelace')).toBeVisible();
    await expect(page).toHaveURL(`/family-trees/public/${TREE_ID}`);
  });

  test('read-only view hides the Shared Users management link', async ({
    page,
  }) => {
    await page.goto(`/family-trees/public/${TREE_ID}`);

    await expect(page.locator('[title="Share Tree"]')).toBeVisible();
    await expect(page.locator('[title="Shared Users"]')).not.toBeVisible();
  });
});
