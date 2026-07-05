import { expect, test } from '@playwright/test';
import {
  API_URL,
  makeMember,
  makeSharedTree,
  mockAuthenticated,
} from './fixtures';

const TREE_ID = '00000000-0000-0000-0000-000000000002';

test.describe('Shared tree detail page (/family-trees/shared/:id)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticated(page);

    await page.route(`${API_URL}/family-trees/shared/${TREE_ID}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          makeSharedTree({ familyTreeId: TREE_ID, name: 'Shared Tree' }),
        ),
      }),
    );

    await page.route(
      `${API_URL}/family-trees/shared/${TREE_ID}/members`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            makeMember({ name: 'Jane Roe', familyTreeId: TREE_ID }),
          ]),
        }),
    );

    await page.route(
      `${API_URL}/family-trees/shared/${TREE_ID}/members/connections`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        }),
    );
  });

  test('renders the visualization with the member from the API', async ({
    page,
  }) => {
    await page.goto(`/family-trees/shared/${TREE_ID}`);

    await expect(page.locator('#FamilyChart')).toBeVisible();
    await expect(page.getByText('Jane Roe')).toBeVisible();
  });

  test('shared user does NOT see the Shared Users management link', async ({
    page,
  }) => {
    await page.goto(`/family-trees/shared/${TREE_ID}`);

    await expect(page.locator('[title="Share Tree"]')).toBeVisible();
    await expect(page.locator('[title="Shared Users"]')).not.toBeVisible();
  });
});
