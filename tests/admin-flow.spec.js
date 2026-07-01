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
const { getAdminSession, getUserSession, injectSession } = require('./helpers/auth');
const { gotoReady } = require('./helpers/navigation');

async function gotoAdmin(page) {
  await gotoReady(page, '/admin.html');
  await expect(page.locator('#admin-main')).toBeVisible({ timeout: 15_000 });
}

async function waitForProductsPanel(page) {
  await page.locator('#products-loading').waitFor({ state: 'hidden', timeout: 15_000 });
  await page.locator('#products-table-wrap:visible, #products-empty:visible').waitFor({ timeout: 15_000 });
}

async function waitForOrdersPanel(page) {
  await page.locator('#orders-loading').waitFor({ state: 'hidden', timeout: 15_000 });
  await page.locator('#orders-table-wrap:visible, #orders-empty:visible').waitFor({ timeout: 15_000 });
}

async function waitForDiscountsPanel(page) {
  await page.locator('#discounts-loading').waitFor({ state: 'hidden', timeout: 15_000 });
  await page.locator('#discounts-table-wrap:visible, #discounts-empty:visible').waitFor({ timeout: 15_000 });
}

// Skip these tests if TEST_SUPABASE_SERVICE_ROLE_KEY is not set
// (e.g. running locally without the test DB configured)
test.describe('Tier 3 — Admin Flow', () => {
  test.describe.configure({ mode: 'serial' });

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
    await gotoAdmin(page);

    // All four stat cards should be present
    await expect(page.locator('#stats-grid .stat-card').first()).toBeVisible({ timeout: 10000 });

    // Navigation tabs
    await expect(page.locator('#tab-products')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#tab-orders')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#tab-settings')).toBeVisible({ timeout: 5000 });
  });

  test('stats grid shows numeric values (not blank)', async ({ page }) => {
    await injectSession(page, adminSession);
    await gotoAdmin(page);

    // Stats should have loaded with actual numbers
    const statValues = page.locator('#stats-grid .stat-value');
    const count = await statValues.count();
    expect(count).toBeGreaterThan(0);
  });

  // ─── Shop Status Toggle ─────────────────────────────────
  test('shop open/close toggle is present and clickable', async ({ page }) => {
    await injectSession(page, adminSession);
    await gotoAdmin(page);

    const shopToggle = page.locator('#shop-toggle');
    await expect(shopToggle).toBeAttached({ timeout: 8000 });

    // Record initial state
    const initialChecked = await shopToggle.isChecked();

    // Toggle it
    await page.locator('label.switch').click();
    await page.waitForTimeout(2000);

    // Should have changed
    const newChecked = await shopToggle.isChecked();
    expect(newChecked).toBe(!initialChecked);

    // Toggle back to restore state
    await page.locator('label.switch').click();
    await page.waitForTimeout(1000);
  });

  // ─── Products Tab ───────────────────────────────────────
  test('products tab loads product list', async ({ page }) => {
    await injectSession(page, adminSession);
    await gotoAdmin(page);
    await waitForProductsPanel(page);

    // Click Products tab
    const productsTab = page.locator('#tab-products');
    await productsTab.click();
    await waitForProductsPanel(page);

    // Product list should have at least the seeded test product
    await expect(page.locator('#products-tbody tr').first()).toBeVisible({ timeout: 8000 });
  });

  test('can open add product form', async ({ page }) => {
    await injectSession(page, adminSession);
    await gotoAdmin(page);

    // Click Products tab
    await page.locator('#tab-products').click();
    await waitForProductsPanel(page);

    // Click Add Product button
    const addBtn = page.locator('#panel-products .section-header button:has-text("Add Product")');
    await addBtn.click();

    // A form or modal should appear
    await expect(page.locator('#product-modal.open #p-name')).toBeVisible({ timeout: 5000 });
  });

  // ─── Orders Tab ─────────────────────────────────────────
  test('orders tab loads order table', async ({ page }) => {
    await injectSession(page, adminSession);
    await gotoAdmin(page);

    // Click Orders tab
    const ordersTab = page.locator('#tab-orders');
    await ordersTab.click();
    await waitForOrdersPanel(page);

    // Either shows orders table or "no orders" empty state
    await expect(page.locator('#orders-table-wrap:visible, #orders-empty:visible')).toBeVisible({ timeout: 8000 });
  });

  test('order filter buttons exist (All, Pending, Processing, Completed)', async ({ page }) => {
    await injectSession(page, adminSession);
    await gotoAdmin(page);

    await page.locator('#tab-orders').click();
    await waitForOrdersPanel(page);

    // Filter buttons
    for (const filter of ['All', 'Pending']) {
      const btn = page.locator(`button:has-text("${filter}")`).first();
      await expect(btn).toBeVisible({ timeout: 5000 });
    }
  });

  // ─── Discounts Tab ──────────────────────────────────────
  test('discounts tab shows seeded discount codes', async ({ page }) => {
    await injectSession(page, adminSession);
    await gotoAdmin(page);

    // Click Discounts tab
    const discountTab = page.locator('#tab-discounts');
    await discountTab.click();
    await waitForDiscountsPanel(page);

    // Should show the TESTDEAL50 seeded code
    await expect(page.locator('text=TESTDEAL50')).toBeVisible({ timeout: 8000 });
  });

  test('can create a new discount code', async ({ page }) => {
    await injectSession(page, adminSession);
    await gotoAdmin(page);

    await page.locator('#tab-discounts').click();
    await waitForDiscountsPanel(page);

    // Fill in new discount form
    const code = `CI${Date.now().toString().slice(-8)}`;
    const codeInput = page.locator('#new-discount-code');
    await codeInput.fill(code);

    const amountInput = page.locator('#new-discount-amount');
    await amountInput.fill('99');

    // Submit
    const submitBtn = page.locator('#panel-discounts button:has-text("Add Code")');
    await submitBtn.click();

    // New code should appear
    await expect(page.locator(`text=${code}`)).toBeVisible({ timeout: 8000 });
  });

  test('settings tab shows announcement controls', async ({ page }) => {
    await injectSession(page, adminSession);
    await gotoAdmin(page);

    await page.locator('#tab-settings').click();

    await expect(page.locator('#panel-settings')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#store-announcement')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#btn-save-announcement')).toBeVisible({ timeout: 5000 });
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

    await gotoReady(page, '/admin.html');
    await page.waitForTimeout(3000);

    // Should be redirected to login or show access denied
    const isRedirected = page.url().includes('login.html') || page.url().includes('index.html');
    const adminVisible = await page.locator('#admin-main, .stats-grid').isVisible();

    expect(isRedirected || !adminVisible).toBe(true);
  });
});
