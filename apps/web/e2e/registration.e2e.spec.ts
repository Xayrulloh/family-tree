import { expect, test } from '@playwright/test';
import {
  API_URL,
  makePaginated,
  makeTree,
  mockAuthenticated,
  mockUnauthenticated,
} from './fixtures';

test.describe('Registration page', () => {
  test('shows the Google login button for unauthenticated users', async ({
    page,
  }) => {
    await mockUnauthenticated(page);

    await page.goto('/register');

    await expect(
      page.getByRole('button', { name: /enter using google/i }),
    ).toBeVisible();
  });

  test('authenticated user is redirected to /family-trees', async ({
    page,
  }) => {
    await mockAuthenticated(page);

    // Suppress fetch errors that fire after the redirect to /family-trees.
    await page.route(`${API_URL}/family-trees**`, (route) => {
      if (route.request().url().includes('/shared')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(makePaginated('sharedFamilyTrees', [])),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makePaginated('familyTrees', [makeTree()])),
      });
    });

    await page.goto('/register');

    await expect(page).toHaveURL('/family-trees');
  });
});
