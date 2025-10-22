import { test, expect } from '@playwright/test';

/**
 * Environment and setup verification tests
 * These should run first to ensure the environment is properly configured
 */

test.describe('Environment Setup', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Chili/i);
  });

  test('should have Supabase environment variables configured', async ({ page }) => {
    await page.goto('/');

    // Navigate to check console for any Supabase connection errors
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    // Wait a moment for any initialization errors
    await page.waitForTimeout(2000);

    // Check that there are no "Missing Supabase" errors
    const supabaseErrors = errors.filter(error =>
      error.includes('Missing Supabase') || error.includes('SUPABASE')
    );

    expect(supabaseErrors).toHaveLength(0);
  });

  test('should connect to Supabase successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load and attempt to fetch chili entries
    // If Supabase is configured correctly, this should work
    await page.waitForTimeout(3000);

    // Check if the page shows content or an error message
    const errorMessage = page.locator('text=/failed to fetch|error loading/i');
    await expect(errorMessage).toHaveCount(0);
  });
});
