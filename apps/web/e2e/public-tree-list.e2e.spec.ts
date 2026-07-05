import { expect, test } from '@playwright/test';
import {
  API_URL,
  makePaginated,
  makeTree,
  mockAuthenticated,
} from './fixtures';

test.describe('Public tree list page (/family-trees/public)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticated(page);

    // Stub personal and shared trees so chainAuthorized's authorized fetch doesn't hit a real server.
    await page.route(`${API_URL}/family-trees**`, (route) => {
      const url = route.request().url();

      if (url.includes('/shared')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(makePaginated('sharedFamilyTrees', [])),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makePaginated('familyTrees', [])),
      });
    });
  });

  test('renders tree cards from API data', async ({ page }) => {
    // Registered after the catch-all → Playwright's LIFO handler order picks this one for /public.
    await page.route(`${API_URL}/family-trees/public**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          makePaginated('familyTrees', [makeTree({ name: 'Smith Family' })]),
        ),
      }),
    );

    await page.goto('/family-trees/public');

    await expect(page.getByText('Smith Family')).toBeVisible();
  });

  test('renders without crashing when the list is empty', async ({ page }) => {
    // The catch-all in beforeEach already returns an empty list for /public — no extra stub needed.
    await page.goto('/family-trees/public');

    await expect(
      page.getByRole('tab', { name: /public family trees/i }),
    ).toBeVisible();

    await expect(
      page.getByRole('tab', { name: /public family trees/i }),
    ).toContainText('0');
  });
});
