import { expect, test } from '@playwright/test';
import {
  API_URL,
  makePaginated,
  makeTree,
  mockAuthenticated,
  mockUnauthenticated,
  mockUser,
} from './fixtures';

test.describe('Tree list page (/family-trees)', () => {
  test('unauthenticated user is redirected to /register', async ({ page }) => {
    await mockUnauthenticated(page);

    await page.goto('/family-trees');

    await expect(page).toHaveURL('/register');
  });

  test('authenticated user sees their trees', async ({ page }) => {
    await mockAuthenticated(page);

    await page.route(`${API_URL}/family-trees**`, (route) => {
      const url = route.request().url();

      if (url.includes('/shared')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(makePaginated('sharedFamilyTrees', [])),
        });
      }

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          makePaginated('familyTrees', [
            makeTree({ id: mockUser.id, name: 'My Family Tree' }),
          ]),
        ),
      });
    });

    await page.goto('/family-trees');

    await expect(
      page.getByText('My Family Tree', { exact: true }),
    ).toBeVisible();
  });
});
