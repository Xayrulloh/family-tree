import { expect, test } from '@playwright/test';
import { mockUnauthenticated } from './fixtures';

test.describe('Not-found page', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
  });

  test('shows the 404 result for an unknown URL', async ({ page }) => {
    await page.goto('/this/route/does/not/exist');

    await expect(page.getByText('404', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Sorry, the page you visited does not exist.'),
    ).toBeVisible();
  });

  test('the Back Home button navigates to the home page', async ({ page }) => {
    await page.goto('/this/route/does/not/exist');

    await page.getByRole('button', { name: 'Back Home' }).click();

    await expect(page).toHaveURL('/');
  });
});
