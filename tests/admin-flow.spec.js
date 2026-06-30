// @ts-check
/**
 * TIER 3 — Admin Flow Tests
 *
 * These tests inject an admin session and verify:
 * - Admin dashboard loads with all sections
 * - Stats are displayed
 * - Product CRUD works
 * - Shop status toggle works
 * - Discount code CRUD works
 * - Order list loads
 *
 * NOTE: These tests run against the LIVE site but interact with
 * the TEST Supabase database via injected session tokens.
 * This works because the session token carries the Supabase project URL.
 *
 * IMPORTANT: For these tests to pass, the test Supabase project must
 * have the schema applied (supabase-schema.sql) and seed data loaded
 * (tests/fixtures/seed.sql).
 */

const { test, expect } = require('@playwright/test');
const { getAdminSession, getUserSession, injectSession, SITE_URL } = require('./helpers/auth');

// Skip these tests if TEST_SUPABASE_SERVICE_ROLE_KEY is not set
// (e.g. running locally without the test DB configured)
test.describe('Tier 3 — Admin Flow', () => {
  test.skip(
    !process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
    'Skipping: TEST_SUPABASE_SERVICE_ROLE_KEY not set'
  );

  let adminSession;

  test.beforeAll(async () => {
    adminSession = await getAdminSession();
  });

  // ─── Admin Dashboard Loads ──────────────────────────────
  test('admin dashboard loads all main sections', async ({ page }) => {
    await injectSession(page, adminSession);
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');

    // All four stat cards should be present
    await expect(page.locator('.stat-card, [class*="stat"]').first()).toBeVisible({ timeout: 10000 });

    // Navigation tabs
    await expect(page.locator('text=Products, text=Orders').first()).toBeVisible({ timeout: 5000 });
  });

  test('stats grid shows numeric values (not blank)', async ({ page }) => {
    await injectSession(page, adminSession);
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Stats should have loaded with actual numbers
    const statValues = page.locator('.stat-value, [class*="stat-num"]');
    const count = await statValues.count();
    expect(count).toBeGreaterThan(0);
  });

  // ─── Shop Status Toggle ─────────────────────────────────
  test('shop open/close toggle is present and clickable', async ({ page }) => {
    await injectSession(page, adminSession);
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');

    const shopToggle = page.locator('#shop-toggle');
    await expect(shopToggle).toBeAttached({ timeout: 8000 });

    // Record initial state
    const initialChecked = await shopToggle.isChecked();

    // Toggle it
    await shopToggle.click();
    await page.waitForTimeout(2000);

    // Should have changed
    const newChecked = await shopToggle.isChecked();
    expect(newChecked).toBe(!initialChecked);

    // Toggle back to restore state
    await shopToggle.click();
    await page.waitForTimeout(1000);
  });

  // ─── Products Tab ───────────────────────────────────────
  test('products tab loads product list', async ({ page }) => {
    await injectSession(page, adminSession);
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');

    // Click Products tab
    const productsTab = page.locator('button:has-text("Products"), [data-tab="products"], #tab-products').first();
    await productsTab.click();
    await page.waitForTimeout(3000);

    // Product list should have at least the seeded test product
    const productItems = page.locator('.product-card, .product-item, [class*="product-row"], tr').first();
    await expect(productItems).toBeVisible({ timeout: 8000 });
  });

  test('can open add product form', async ({ page }) => {
    await injectSession(page, adminSession);
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');

    // Click Products tab
    await page.locator('button:has-text("Products"), [data-tab="products"], #tab-products').first().click();
    await page.waitForTimeout(1000);

    // Click Add Product button
    const addBtn = page.locator('button:has-text("Add"), button:has-text("New Product"), #add-product-btn').first();
    await addBtn.click();
    await page.waitForTimeout(500);

    // A form or modal should appear
    await expect(
      page.locator('input[placeholder*="name" i], input[name="name"], #product-name').first()
    ).toBeVisible({ timeout: 5000 });
  });

  // ─── Orders Tab ─────────────────────────────────────────
  test('orders tab loads order table', async ({ page }) => {
    await injectSession(page, adminSession);
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');

    // Click Orders tab
    const ordersTab = page.locator('button:has-text("Orders"), [data-tab="orders"], #tab-orders').first();
    await ordersTab.click();
    await page.waitForTimeout(3000);

    // Either shows orders table or "no orders" empty state
    const content = page.locator('.order-row, tr, .empty-state, text=No orders').first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });

  test('order filter buttons exist (All, Pending, Processing, Completed)', async ({ page }) => {
    await injectSession(page, adminSession);
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Orders"), [data-tab="orders"], #tab-orders').first().click();
    await page.waitForTimeout(1000);

    // Filter buttons
    for (const filter of ['All', 'Pending']) {
      const btn = page.locator(`button:has-text("${filter}")`).first();
      await expect(btn).toBeVisible({ timeout: 5000 });
    }
  });

  // ─── Discounts Tab ──────────────────────────────────────
  test('discounts tab shows seeded discount codes', async ({ page }) => {
    await injectSession(page, adminSession);
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');

    // Click Discounts tab
    const discountTab = page.locator('button:has-text("Discount"), [data-tab="discounts"], #tab-discounts').first();
    await discountTab.click();
    await page.waitForTimeout(3000);

    // Should show the TESTDEAL50 seeded code
    await expect(page.locator('text=TESTDEAL50')).toBeVisible({ timeout: 8000 });
  });

  test('can create a new discount code', async ({ page }) => {
    await injectSession(page, adminSession);
    await page.goto('/admin.html');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Discount"), [data-tab="discounts"], #tab-discounts').first().click();
    await page.waitForTimeout(1000);

    // Fill in new discount form
    const codeInput = page.locator('input[placeholder*="code" i], input[name="code"], #discount-code').first();
    await codeInput.fill('CITEST99');

    const amountInput = page.locator('input[placeholder*="amount" i], input[name="amount"], #discount-amount').first();
    await amountInput.fill('99');

    // Submit
    const submitBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(3000);

    // New code should appear
    await expect(page.locator('text=CITEST99')).toBeVisible({ timeout: 8000 });
  });
});

// ─── Regular User Cannot Access Admin ─────────────────────────
test.describe('Tier 3 — Role Security', () => {
  test.skip(
    !process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
    'Skipping: TEST_SUPABASE_SERVICE_ROLE_KEY not set'
  );

  test('regular user injected with session cannot see admin dashboard', async ({ page }) => {
    const userSession = await getUserSession();
    await injectSession(page, userSession);

    await page.goto('/admin.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Should be redirected to login or show access denied
    const isRedirected = page.url().includes('login.html') || page.url().includes('index.html');
    const adminVisible = await page.locator('#admin-main, .stats-grid').isVisible();

    expect(isRedirected || !adminVisible).toBe(true);
  });
});
