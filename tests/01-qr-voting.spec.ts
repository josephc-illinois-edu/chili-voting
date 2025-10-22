import { test, expect } from '@playwright/test';
import { TestDataHelper } from './helpers/test-data';

/**
 * QR Code Voting Flow Tests
 * Tests the /vote route that handles QR code scans
 */

test.describe('QR Code Voting Flow', () => {
  let testChiliId: string;

  test.beforeAll(async () => {
    // Create a test chili for these tests
    try {
      testChiliId = await TestDataHelper.createTestChili({
        name: 'Test QR Chili',
        contestant_name: 'QR Test Chef',
        recipe: 'QR Test Recipe',
        spice_level: 3,
        description: 'A chili created for QR code voting tests'
      });
      console.log(`Created test chili with ID: ${testChiliId}`);
    } catch (error) {
      console.error('Failed to create test chili:', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    // Clean up test data
    try {
      if (testChiliId) {
        await TestDataHelper.deleteTestVotes(testChiliId);
        await TestDataHelper.deleteTestChili(testChiliId);
        console.log('Cleaned up test data');
      }
    } catch (error) {
      console.error('Failed to cleanup:', error);
    }
  });

  test('should load vote page with valid chili ID parameter', async ({ page }) => {
    await page.goto(`/vote?chili=${testChiliId}`);
    await page.waitForTimeout(2000);

    // Should display the chili name
    const chiliName = page.locator('h1:has-text("Test QR Chili")');
    await expect(chiliName).toBeVisible();

    // Should display contestant name
    const contestantName = page.locator('text=/QR Test Chef/i');
    await expect(contestantName).toBeVisible();

    // Should display rating form
    const overallRatingLabel = page.locator('text=/Overall Rating/i');
    await expect(overallRatingLabel).toBeVisible();
  });

  test('should display all required rating categories', async ({ page }) => {
    await page.goto(`/vote?chili=${testChiliId}`);
    await page.waitForTimeout(2000);

    // Check all rating categories are present
    await expect(page.locator('text=/Overall Rating/i')).toBeVisible();
    await expect(page.locator('text=/^Taste/i')).toBeVisible();
    await expect(page.locator('text=/Presentation/i')).toBeVisible();
    await expect(page.locator('text=/Creativity/i')).toBeVisible();
    await expect(page.locator('text=/Spice Balance/i')).toBeVisible();
    await expect(page.locator('text=/Comments/i')).toBeVisible();
  });

  test('should have back button to return to home', async ({ page }) => {
    await page.goto(`/vote?chili=${testChiliId}`);
    await page.waitForTimeout(2000);

    const backButton = page.locator('button:has-text("Back to All Chilis")');
    await expect(backButton).toBeVisible();

    // Click and verify navigation
    await backButton.click();
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/\/$/);
  });

  test('should validate that all rating fields are required before submission', async ({ page }) => {
    await page.goto(`/vote?chili=${testChiliId}`);
    await page.waitForTimeout(2000);

    // Try to submit without filling any ratings
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Please rate all categories');
      dialog.accept();
    });

    const submitButton = page.locator('button:has-text("Submit Vote")');
    await submitButton.click();
  });

  test('should complete full voting flow with all ratings', async ({ page, context }) => {
    // Navigate first, then clear localStorage to ensure fresh session
    await page.goto(`/vote?chili=${testChiliId}`);
    await page.waitForTimeout(1000);

    // Clear localStorage to reset voting history
    await page.evaluate(() => localStorage.clear());

    // Reload to apply the cleared localStorage
    await page.reload();
    await page.waitForTimeout(2000);

    // Fill out all rating fields by clicking stars directly
    // Each rating section has 5 star buttons, we'll click the 4th star (index 3)

    // Overall Rating - first set of stars
    await page.locator('div').filter({ hasText: /^Overall Rating \*$/ }).locator('button').nth(3).click();
    await page.waitForTimeout(300);

    // Taste - second set of stars
    await page.locator('div').filter({ hasText: /^Taste \*$/ }).locator('button').nth(3).click();
    await page.waitForTimeout(300);

    // Presentation - third set of stars
    await page.locator('div').filter({ hasText: /^Presentation \*$/ }).locator('button').nth(3).click();
    await page.waitForTimeout(300);

    // Creativity - fourth set of stars
    await page.locator('div').filter({ hasText: /^Creativity \*$/ }).locator('button').nth(3).click();
    await page.waitForTimeout(300);

    // Spice Balance - fifth set of stars
    await page.locator('div').filter({ hasText: /^Spice Balance \*$/ }).locator('button').nth(3).click();
    await page.waitForTimeout(300);

    // Add optional comment
    const commentBox = page.locator('textarea[placeholder*="thoughts"]');
    await commentBox.fill('Test comment from automated test');

    // Set up dialog handler for success message
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Vote submitted successfully');
      dialog.accept();
    });

    // Submit the vote
    const submitButton = page.locator('button:has-text("Submit Vote")');
    await submitButton.click();

    // Wait for submission and redirect
    await page.waitForTimeout(2000);

    // Should redirect to home page
    expect(page.url()).toMatch(/\/$/);
  });

  test('should prevent double voting on same chili', async ({ page }) => {
    // First, submit a vote
    await page.goto(`/vote?chili=${testChiliId}`);
    await page.waitForTimeout(2000);

    // Fill out ratings quickly
    await page.locator('div').filter({ hasText: /^Overall Rating \*$/ }).locator('button').nth(2).click();
    await page.locator('div').filter({ hasText: /^Taste \*$/ }).locator('button').nth(2).click();
    await page.locator('div').filter({ hasText: /^Presentation \*$/ }).locator('button').nth(2).click();
    await page.locator('div').filter({ hasText: /^Creativity \*$/ }).locator('button').nth(2).click();
    await page.locator('div').filter({ hasText: /^Spice Balance \*$/ }).locator('button').nth(2).click();

    // Submit the vote
    page.once('dialog', dialog => dialog.accept());
    await page.locator('button:has-text("Submit Vote")').click();
    await page.waitForTimeout(2000);

    // Now try to vote again on the same chili
    await page.goto(`/vote?chili=${testChiliId}`);
    await page.waitForTimeout(3000);

    // Should show error about already voting
    const errorMessage = page.locator('text=/already voted/i');
    await expect(errorMessage).toBeVisible();
  });
});

/**
 * Error handling tests
 */
test.describe('QR Code Error Handling', () => {
  test('should handle missing chili ID gracefully', async ({ page }) => {
    await page.goto('/vote');

    // Wait for either the error message or loading to finish
    await page.waitForSelector('text=/No chili ID provided|Loading chili/i', { timeout: 5000 });

    const errorMessage = page.locator('text=/No chili ID provided/i');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    const homeButton = page.locator('button:has-text("Go to Home")');
    await expect(homeButton).toBeVisible();
  });

  test('should handle invalid chili ID gracefully', async ({ page }) => {
    await page.goto('/vote?chili=invalid-id-999');

    // Wait for error display
    await page.waitForTimeout(2000);

    // Check for the "Oops!" heading specifically
    const oopsHeading = page.getByRole('heading', { name: 'Oops!' });
    await expect(oopsHeading).toBeVisible();

    // Should have a button to go home
    const homeButton = page.locator('button:has-text("Go to Home")');
    await expect(homeButton).toBeVisible();
  });
});
