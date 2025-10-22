import { test, expect } from '@playwright/test';

/**
 * Admin Authentication Tests
 * Tests the admin panel password protection
 */

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'chili2025!';

test.describe('Admin Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/admin');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display login form when not authenticated', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    // Should show login page elements
    const loginHeading = page.getByRole('heading', { name: 'Admin Login' });
    await expect(loginHeading).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    const loginButton = page.locator('button:has-text("Login")');
    await expect(loginButton).toBeVisible();

    // Should have back to home link
    const backLink = page.locator('a:has-text("Back to Home")');
    await expect(backLink).toBeVisible();
  });

  test('should show lock icon on login page', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    // Check for Lock icon (SVG)
    const lockIcon = page.locator('svg').first();
    await expect(lockIcon).toBeVisible();
  });

  test('should successfully login with correct password', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    // Fill in password
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(ADMIN_PASSWORD);

    // Submit form
    const loginButton = page.locator('button:has-text("Login")');
    await loginButton.click();

    // Wait for admin panel to load
    await page.waitForTimeout(2000);

    // Should show admin panel
    const adminHeading = page.getByRole('heading', { name: 'Admin Panel' });
    await expect(adminHeading).toBeVisible();

    // Should show logout button
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();

    // Should show admin functionality
    const addButton = page.locator('button:has-text("Add New Chili Entry")');
    await expect(addButton).toBeVisible();
  });

  test('should show error message with incorrect password', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    // Fill in wrong password
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('wrongpassword123');

    // Submit form
    const loginButton = page.locator('button:has-text("Login")');
    await loginButton.click();

    // Wait for error to appear
    await page.waitForTimeout(500);

    // Should show error message
    const errorMessage = page.locator('text=/Incorrect password/i');
    await expect(errorMessage).toBeVisible();

    // Should still be on login page
    const loginHeading = page.getByRole('heading', { name: 'Admin Login' });
    await expect(loginHeading).toBeVisible();
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // Login first
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(ADMIN_PASSWORD);

    const loginButton = page.locator('button:has-text("Login")');
    await loginButton.click();
    await page.waitForTimeout(2000);

    // Verify logged in
    const adminHeading = page.getByRole('heading', { name: 'Admin Panel' });
    await expect(adminHeading).toBeVisible();

    // Reload the page
    await page.reload();
    await page.waitForTimeout(2000);

    // Should still be logged in
    await expect(adminHeading).toBeVisible();

    // Should not show login form
    const passwordInputAfterReload = page.locator('input[type="password"]');
    await expect(passwordInputAfterReload).not.toBeVisible();
  });

  test('should successfully logout', async ({ page }) => {
    // Login first
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(ADMIN_PASSWORD);

    const loginButton = page.locator('button:has-text("Login")');
    await loginButton.click();
    await page.waitForTimeout(2000);

    // Click logout
    const logoutButton = page.locator('button:has-text("Logout")');
    await logoutButton.click();
    await page.waitForTimeout(1000);

    // Should be back on login page
    const loginHeading = page.getByRole('heading', { name: 'Admin Login' });
    await expect(loginHeading).toBeVisible();

    // Should not show admin content
    const addButton = page.locator('button:has-text("Add New Chili Entry")');
    await expect(addButton).not.toBeVisible();
  });

  test('should clear password field after successful login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(ADMIN_PASSWORD);

    const loginButton = page.locator('button:has-text("Login")');
    await loginButton.click();
    await page.waitForTimeout(2000);

    // Logout to go back to login page
    const logoutButton = page.locator('button:has-text("Logout")');
    await logoutButton.click();
    await page.waitForTimeout(1000);

    // Password field should be empty
    const passwordInputAfterLogout = page.locator('input[type="password"]');
    await expect(passwordInputAfterLogout).toHaveValue('');
  });

  test('should require password to access admin features', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    // Admin features should not be accessible
    const addButton = page.locator('button:has-text("Add New Chili Entry")');
    await expect(addButton).not.toBeVisible();

    const printButton = page.locator('button:has-text("Print QR Codes")');
    await expect(printButton).not.toBeVisible();

    // Should show login form instead
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });
});

test.describe('Admin Panel Functionality (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/admin');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1000);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(ADMIN_PASSWORD);

    const loginButton = page.locator('button:has-text("Login")');
    await loginButton.click();
    await page.waitForTimeout(2000);
  });

  test('should display admin panel after login', async ({ page }) => {
    const adminHeading = page.getByRole('heading', { name: 'Admin Panel' });
    await expect(adminHeading).toBeVisible();

    const addButton = page.locator('button:has-text("Add New Chili Entry")');
    await expect(addButton).toBeVisible();

    const printButton = page.locator('button:has-text("Print QR Codes")');
    await expect(printButton).toBeVisible();
  });

  test('should show current entries section', async ({ page }) => {
    const currentEntriesHeading = page.getByRole('heading', { name: 'Current Entries' });
    await expect(currentEntriesHeading).toBeVisible();
  });

  test('should have back to home link', async ({ page }) => {
    const backLink = page.locator('a:has-text("Back to Home")');
    await expect(backLink).toBeVisible();

    // Click should navigate to home
    await backLink.click();
    await page.waitForTimeout(1000);

    // Should be on home page
    expect(page.url()).toMatch(/\/$/);
  });
});
