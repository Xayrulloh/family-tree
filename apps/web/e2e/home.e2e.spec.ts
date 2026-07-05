import { expect, test } from '@playwright/test';
import { mockUnauthenticated } from './fixtures';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
  });

  test('renders the hero heading', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1').first()).toContainText("Your Family's");
  });

  test('"Start Your Journey" navigates to /register', async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('button', { name: 'Start Your Journey' })
      .first()
      .click();

    await expect(page).toHaveURL('/register');
  });
});
