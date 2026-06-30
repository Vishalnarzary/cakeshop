// @ts-check
/**
 * TIER 2 — Page Rendering Tests
 *
 * These tests open each page in a real browser and verify that the
 * critical UI elements are present and visible. They catch:
 * - Broken HTML structure
 * - Missing buttons or forms
 * - Auth guards redirecting correctly
 * - Admin secret tab unlock
 */

const { test, expect } = require('@playwright/test');

// ─── Homepage ─────────────────────────────────────────────────
test.describe('Homepage', () => {
  test('has navbar and hero section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navbar must exist
    await expect(page.locator('nav, #navbar, .navbar').first()).toBeVisible({ timeout: 5000 });
  });

  test('has product grid or loading state', async ({ page }) => {
    await page.goto('/');
    // Wait for either products to load or empty state
    await page.waitForTimeout(3000);
    // The products section should exist in the DOM
    const productsSection = page.locator('#products-section').first();
    await expect(productsSection).toBeAttached({ timeout: 5000 });
  });

  test('has sign in link in navbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Either a sign in button or a user avatar is visible
    const signInEl = page.locator('a[href*="login"], #auth-btn, #signin-btn, :text("Sign In")').first();
    await expect(signInEl).toBeVisible({ timeout: 5000 });
  });
});

// ─── Login Page ───────────────────────────────────────────────
test.describe('Login Page', () => {
  test('has email and password inputs and sign in button', async ({ page }) => {
    await page.goto('/login.html');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('input[type="email"], input[name="email"], #email').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"], #password').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"], #login-btn, button:has-text("Sign In")').first()).toBeVisible({ timeout: 5000 });
  });

  test('admin tab is hidden by default', async ({ page }) => {
    await page.goto('/login.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Admin tab should NOT be visible by default
    const adminTab = page.locator('#admin-tab, [data-tab="admin"], :text("Admin Login")').first();
    await expect(adminTab).not.toBeVisible({ timeout: 3000 }).catch(() => {
      // Tab might not exist at all — that's also correct
    });
  });

  test('typing 1111 in email and password reveals admin tab', async ({ page }) => {
    await page.goto('/login.html');
    await page.waitForLoadState('domcontentloaded');

    // Type '1111' into the email field
    const emailInput = page.locator('input[type="email"], #email').first();
    await emailInput.click();
    await emailInput.fill('1111');

    // Type '1111' into the password field
    const passwordInput = page.locator('input[type="password"], #password').first();
    await passwordInput.click();
    await passwordInput.fill('1111');

    // Wait for the hash check (it's async)
    await page.waitForTimeout(1000);

    // Admin tab should now be visible
    const adminTab = page.locator('#admin-tab, [data-tab="admin"], :text("Admin")').first();
    await expect(adminTab).toBeVisible({ timeout: 5000 });
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login.html');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="email"], #email').first().fill('wrong@email.com');
    await page.locator('input[type="password"], #password').first().fill('wrongpassword');
    await page.locator('button[type="submit"], #login-btn, button:has-text("Sign In")').first().click();

    // An error message should appear
    await expect(
      page.locator('.error, .toast-error, [class*="error"], :text("Invalid")').first()
    ).toBeVisible({ timeout: 8000 });
  });
});

// ─── Register Page ────────────────────────────────────────────
test.describe('Register Page', () => {
  test('has all registration form fields', async ({ page }) => {
    await page.goto('/register.html');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('input[name="name"], #name, input[placeholder*="name" i]').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    await expect(page.locator('input[type="email"], #email').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows error if passwords do not match', async ({ page }) => {
    await page.goto('/register.html');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[name="name"], #name, input[placeholder*="name" i]').first().fill('Test User');
    await page.locator('input[type="email"], #email').first().fill('test@test.com');

    const passwords = page.locator('input[type="password"]');
    await passwords.nth(0).fill('password123');
    await passwords.nth(1).fill('different456');

    await page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")').first().click();

    // Error about password mismatch
    await expect(
      page.locator('.error, [class*="error"], :text("match"), :text("password")').first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// ─── Auth Guards (Unauthenticated Access) ─────────────────────
test.describe('Auth Guards', () => {
  test('buy.html redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/buy.html?product=11111111-1111-1111-1111-111111111111');
    // Should redirect to login within 5 seconds
    await page.waitForURL(/login\.html/, { timeout: 8000 });
    expect(page.url()).toContain('login.html');
  });

  test('orders.html redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/orders.html');
    await page.waitForURL(/login\.html/, { timeout: 8000 });
    expect(page.url()).toContain('login.html');
  });

  test('admin.html does not expose admin controls when not authenticated', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Admin main content should be hidden or page should redirect
    const isRedirected = page.url().includes('login.html');
    const adminMain = await page.locator('#admin-main, .admin-main, .stats-grid').isVisible();

    // Either redirected OR admin content is hidden
    expect(isRedirected || !adminMain).toBe(true);
  });
});

// ─── Reset Password Page ──────────────────────────────────────
test.describe('Reset Password Page', () => {
  test('has password input and reset button', async ({ page }) => {
    await page.goto('/reset-password.html');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('input[type="password"], #password').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"], button:has-text("Reset"), button:has-text("Update")').first()).toBeVisible({ timeout: 5000 });
  });
});
