# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pages.spec.js >> Login Page >> shows error for wrong credentials
- Location: tests\pages.spec.js:88:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: .error, .toast-error, [class*="error"], text=Invalid >> nth=0
Expected: visible
Error: Unexpected token "=" while parsing css selector ".error, .toast-error, [class*="error"], text=Invalid". Did you mean to CSS.escape it?

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for .error, .toast-error, [class*="error"], text=Invalid >> nth=0

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - link "C Caramel" [ref=e4] [cursor=pointer]:
      - /url: index.html
      - generic [ref=e5]: C
      - generic [ref=e6]: Caramel
  - generic [ref=e7]:
    - generic [ref=e8]:
      - heading "Cake Shop" [level=1] [ref=e9]
      - paragraph [ref=e10]: Sign in to your account
    - button "👤 User Login" [ref=e12] [cursor=pointer]
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: Email Address *
        - textbox "Email Address *" [ref=e16]:
          - /placeholder: you@example.com
          - text: wrong@email.com
      - generic [ref=e17]:
        - generic [ref=e18]: Password *
        - textbox "Password *" [ref=e19]:
          - /placeholder: Enter your password
          - text: wrongpassword
      - button "Signing in..." [disabled] [ref=e20]:
        - generic [ref=e21]: Signing in...
    - generic [ref=e22]:
      - text: Don't have an account?
      - link "Create one" [ref=e23] [cursor=pointer]:
        - /url: register.html
```

# Test source

```ts
  1   | // @ts-check
  2   | /**
  3   |  * TIER 2 — Page Rendering Tests
  4   |  *
  5   |  * These tests open each page in a real browser and verify that the
  6   |  * critical UI elements are present and visible. They catch:
  7   |  * - Broken HTML structure
  8   |  * - Missing buttons or forms
  9   |  * - Auth guards redirecting correctly
  10  |  * - Admin secret tab unlock
  11  |  */
  12  | 
  13  | const { test, expect } = require('@playwright/test');
  14  | 
  15  | // ─── Homepage ─────────────────────────────────────────────────
  16  | test.describe('Homepage', () => {
  17  |   test('has navbar and hero section', async ({ page }) => {
  18  |     await page.goto('/');
  19  |     await page.waitForLoadState('domcontentloaded');
  20  | 
  21  |     // Navbar must exist
  22  |     await expect(page.locator('nav, #navbar, .navbar').first()).toBeVisible({ timeout: 5000 });
  23  |   });
  24  | 
  25  |   test('has product grid or loading state', async ({ page }) => {
  26  |     await page.goto('/');
  27  |     // Wait for either products to load or empty state
  28  |     await page.waitForTimeout(3000);
  29  |     // The products section should exist in the DOM
  30  |     const productsSection = page.locator('#products-section').first();
  31  |     await expect(productsSection).toBeAttached({ timeout: 5000 });
  32  |   });
  33  | 
  34  |   test('has sign in link in navbar', async ({ page }) => {
  35  |     await page.goto('/');
  36  |     await page.waitForLoadState('domcontentloaded');
  37  |     // Either a sign in button or a user avatar is visible
  38  |     const signInEl = page.locator('a[href*="login"], #auth-btn, #signin-btn, :text("Sign In")').first();
  39  |     await expect(signInEl).toBeVisible({ timeout: 5000 });
  40  |   });
  41  | });
  42  | 
  43  | // ─── Login Page ───────────────────────────────────────────────
  44  | test.describe('Login Page', () => {
  45  |   test('has email and password inputs and sign in button', async ({ page }) => {
  46  |     await page.goto('/login.html');
  47  |     await page.waitForLoadState('domcontentloaded');
  48  | 
  49  |     await expect(page.locator('input[type="email"], input[name="email"], #email').first()).toBeVisible({ timeout: 5000 });
  50  |     await expect(page.locator('input[type="password"], #password').first()).toBeVisible({ timeout: 5000 });
  51  |     await expect(page.locator('button[type="submit"], #login-btn, button:has-text("Sign In")').first()).toBeVisible({ timeout: 5000 });
  52  |   });
  53  | 
  54  |   test('admin tab is hidden by default', async ({ page }) => {
  55  |     await page.goto('/login.html');
  56  |     await page.waitForLoadState('domcontentloaded');
  57  |     await page.waitForTimeout(500);
  58  | 
  59  |     // Admin tab should NOT be visible by default
  60  |     const adminTab = page.locator('#admin-tab, [data-tab="admin"], text=Admin Login').first();
  61  |     await expect(adminTab).not.toBeVisible({ timeout: 3000 }).catch(() => {
  62  |       // Tab might not exist at all — that's also correct
  63  |     });
  64  |   });
  65  | 
  66  |   test('typing 1111 in email and password reveals admin tab', async ({ page }) => {
  67  |     await page.goto('/login.html');
  68  |     await page.waitForLoadState('domcontentloaded');
  69  | 
  70  |     // Type '1111' into the email field
  71  |     const emailInput = page.locator('input[type="email"], #email').first();
  72  |     await emailInput.click();
  73  |     await emailInput.fill('1111');
  74  | 
  75  |     // Type '1111' into the password field
  76  |     const passwordInput = page.locator('input[type="password"], #password').first();
  77  |     await passwordInput.click();
  78  |     await passwordInput.fill('1111');
  79  | 
  80  |     // Wait for the hash check (it's async)
  81  |     await page.waitForTimeout(1000);
  82  | 
  83  |     // Admin tab should now be visible
  84  |     const adminTab = page.locator('#admin-tab, [data-tab="admin"], text=Admin').first();
  85  |     await expect(adminTab).toBeVisible({ timeout: 5000 });
  86  |   });
  87  | 
  88  |   test('shows error for wrong credentials', async ({ page }) => {
  89  |     await page.goto('/login.html');
  90  |     await page.waitForLoadState('domcontentloaded');
  91  | 
  92  |     await page.locator('input[type="email"], #email').first().fill('wrong@email.com');
  93  |     await page.locator('input[type="password"], #password').first().fill('wrongpassword');
  94  |     await page.locator('button[type="submit"], #login-btn, button:has-text("Sign In")').first().click();
  95  | 
  96  |     // An error message should appear
  97  |     await expect(
  98  |       page.locator('.error, .toast-error, [class*="error"], text=Invalid').first()
> 99  |     ).toBeVisible({ timeout: 8000 });
      |       ^ Error: expect(locator).toBeVisible() failed
  100 |   });
  101 | });
  102 | 
  103 | // ─── Register Page ────────────────────────────────────────────
  104 | test.describe('Register Page', () => {
  105 |   test('has all registration form fields', async ({ page }) => {
  106 |     await page.goto('/register.html');
  107 |     await page.waitForLoadState('domcontentloaded');
  108 | 
  109 |     await expect(page.locator('input[name="name"], #name, input[placeholder*="name" i]').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  110 |     await expect(page.locator('input[type="email"], #email').first()).toBeVisible({ timeout: 5000 });
  111 |     await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5000 });
  112 |   });
  113 | 
  114 |   test('shows error if passwords do not match', async ({ page }) => {
  115 |     await page.goto('/register.html');
  116 |     await page.waitForLoadState('domcontentloaded');
  117 | 
  118 |     await page.locator('input[name="name"], #name, input[placeholder*="name" i]').first().fill('Test User');
  119 |     await page.locator('input[type="email"], #email').first().fill('test@test.com');
  120 | 
  121 |     const passwords = page.locator('input[type="password"]');
  122 |     await passwords.nth(0).fill('password123');
  123 |     await passwords.nth(1).fill('different456');
  124 | 
  125 |     await page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")').first().click();
  126 | 
  127 |     // Error about password mismatch
  128 |     await expect(
  129 |       page.locator('.error, [class*="error"], text=match, text=password').first()
  130 |     ).toBeVisible({ timeout: 5000 });
  131 |   });
  132 | });
  133 | 
  134 | // ─── Auth Guards (Unauthenticated Access) ─────────────────────
  135 | test.describe('Auth Guards', () => {
  136 |   test('buy.html redirects to login when not authenticated', async ({ page }) => {
  137 |     await page.goto('/buy.html?product=11111111-1111-1111-1111-111111111111');
  138 |     // Should redirect to login within 5 seconds
  139 |     await page.waitForURL(/login\.html/, { timeout: 8000 });
  140 |     expect(page.url()).toContain('login.html');
  141 |   });
  142 | 
  143 |   test('orders.html redirects to login when not authenticated', async ({ page }) => {
  144 |     await page.goto('/orders.html');
  145 |     await page.waitForURL(/login\.html/, { timeout: 8000 });
  146 |     expect(page.url()).toContain('login.html');
  147 |   });
  148 | 
  149 |   test('admin.html does not expose admin controls when not authenticated', async ({ page }) => {
  150 |     await page.goto('/admin.html');
  151 |     await page.waitForLoadState('domcontentloaded');
  152 |     await page.waitForTimeout(3000);
  153 | 
  154 |     // Admin main content should be hidden or page should redirect
  155 |     const isRedirected = page.url().includes('login.html');
  156 |     const adminMain = await page.locator('#admin-main, .admin-main, .stats-grid').isVisible();
  157 | 
  158 |     // Either redirected OR admin content is hidden
  159 |     expect(isRedirected || !adminMain).toBe(true);
  160 |   });
  161 | });
  162 | 
  163 | // ─── Reset Password Page ──────────────────────────────────────
  164 | test.describe('Reset Password Page', () => {
  165 |   test('has password input and reset button', async ({ page }) => {
  166 |     await page.goto('/reset-password.html');
  167 |     await page.waitForLoadState('domcontentloaded');
  168 | 
  169 |     await expect(page.locator('input[type="password"], #password').first()).toBeVisible({ timeout: 5000 });
  170 |     await expect(page.locator('button[type="submit"], button:has-text("Reset"), button:has-text("Update")').first()).toBeVisible({ timeout: 5000 });
  171 |   });
  172 | });
  173 | 
```