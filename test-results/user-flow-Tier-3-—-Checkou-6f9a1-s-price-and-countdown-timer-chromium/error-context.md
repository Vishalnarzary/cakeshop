# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-flow.spec.js >> Tier 3 — Checkout (Buy Page) >> buy page shows price and countdown timer
- Location: tests\user-flow.spec.js:134:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=500').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=500').first()

```

```yaml
- navigation:
  - link "C Caramel":
    - /url: index.html
- heading "Cake Shop" [level=1]
- paragraph: Sign in to your account
- button "👤 User Login"
- text: Email Address *
- textbox "Email Address *":
  - /placeholder: you@example.com
- text: Password *
- textbox "Password *":
  - /placeholder: Enter your password
- button "Sign In"
- text: Don't have an account?
- link "Create one":
  - /url: register.html
```

# Test source

```ts
  42  | 
  43  |     // Lightbox / modal should appear
  44  |     const lightbox = page.locator('#lightbox, .lightbox, [class*="modal"], [class*="lightbox"]').first();
  45  |     await expect(lightbox).toBeVisible({ timeout: 5000 });
  46  |   });
  47  | 
  48  |   test('out-of-stock products show disabled buy button', async ({ page }) => {
  49  |     await page.goto('/');
  50  |     await page.waitForTimeout(4000);
  51  | 
  52  |     // Find a card with "Out of Stock" or "0" quantity
  53  |     const outOfStockCard = page.locator('text=Out of Stock').first();
  54  |     const count = await outOfStockCard.count();
  55  | 
  56  |     if (count > 0) {
  57  |       // If there's an out-of-stock item, the buy button within it should be disabled
  58  |       const card = outOfStockCard.locator('..').locator('..');
  59  |       const buyBtn = card.locator('button:has-text("Buy"), button:has-text("Order")').first();
  60  |       await expect(buyBtn).toBeDisabled({ timeout: 3000 });
  61  |     } else {
  62  |       // No out-of-stock items — test passes (nothing to check)
  63  |       test.info().annotations.push({ type: 'skip', description: 'No out-of-stock products found' });
  64  |     }
  65  |   });
  66  | 
  67  |   test('shop closed banner appears when shop is closed', async ({ page }) => {
  68  |     // This test is informational — checks if the shop-closed UI works
  69  |     // We don't actually close the shop here (that would affect production)
  70  |     // Instead we verify the UI element exists in the DOM
  71  |     await page.goto('/');
  72  |     await page.waitForLoadState('domcontentloaded');
  73  | 
  74  |     // The shop-closed overlay or banner element should exist in the DOM
  75  |     // (it will be hidden if shop is open, which is the expected state)
  76  |     const shopClosedEl = page.locator(
  77  |       '#shop-closed-overlay, .shop-closed, [id*="closed"], [class*="closed"]'
  78  |     ).first();
  79  |     // We just check it's attached (not necessarily visible)
  80  |     await expect(shopClosedEl).toBeAttached({ timeout: 5000 }).catch(() => {
  81  |       // OK if it doesn't exist at all when shop is open
  82  |     });
  83  |   });
  84  | });
  85  | 
  86  | // ─── Orders Page ─────────────────────────────────────────────
  87  | test.describe('Tier 3 — Orders Page (Authenticated)', () => {
  88  |   test.skip(
  89  |     !process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
  90  |     'Skipping: TEST_SUPABASE_SERVICE_ROLE_KEY not set'
  91  |   );
  92  | 
  93  |   test('orders page loads correctly for logged-in user', async ({ page }) => {
  94  |     const userSession = await getUserSession();
  95  |     await injectSession(page, userSession);
  96  | 
  97  |     await page.goto('/orders.html');
  98  |     await page.waitForLoadState('networkidle');
  99  |     await page.waitForTimeout(3000);
  100 | 
  101 |     // Should NOT redirect to login
  102 |     expect(page.url()).not.toContain('login.html');
  103 | 
  104 |     // Either shows orders or the empty state
  105 |     const content = page.locator('.order-card, [class*="order"], text=No orders, text=Browse').first();
  106 |     await expect(content).toBeVisible({ timeout: 8000 });
  107 |   });
  108 | });
  109 | 
  110 | // ─── Checkout Page (Buy Flow) ─────────────────────────────────
  111 | test.describe('Tier 3 — Checkout (Buy Page)', () => {
  112 |   test.skip(
  113 |     !process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
  114 |     'Skipping: TEST_SUPABASE_SERVICE_ROLE_KEY not set'
  115 |   );
  116 | 
  117 |   test('buy page loads with valid product and auth session', async ({ page }) => {
  118 |     const userSession = await getUserSession();
  119 |     await injectSession(page, userSession);
  120 | 
  121 |     await page.goto(`/buy.html?product=${TEST_PRODUCT_ID}`);
  122 |     await page.waitForLoadState('networkidle');
  123 |     await page.waitForTimeout(3000);
  124 | 
  125 |     // Should NOT redirect to login
  126 |     expect(page.url()).not.toContain('login.html');
  127 | 
  128 |     // Product name should be visible
  129 |     await expect(
  130 |       page.locator('text=Test Caramel Cake').first()
  131 |     ).toBeVisible({ timeout: 8000 });
  132 |   });
  133 | 
  134 |   test('buy page shows price and countdown timer', async ({ page }) => {
  135 |     const userSession = await getUserSession();
  136 |     await injectSession(page, userSession);
  137 | 
  138 |     await page.goto(`/buy.html?product=${TEST_PRODUCT_ID}`);
  139 |     await page.waitForTimeout(4000);
  140 | 
  141 |     // Price should be visible (₹500)
> 142 |     await expect(page.locator('text=500').first()).toBeVisible({ timeout: 5000 });
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  143 | 
  144 |     // Timer should be visible (10:00 countdown)
  145 |     const timer = page.locator('[id*="timer"], [class*="timer"], text=remaining').first();
  146 |     await expect(timer).toBeVisible({ timeout: 5000 }).catch(() => {
  147 |       // Timer might use different approach — skip if not found
  148 |     });
  149 |   });
  150 | 
  151 |   test('applying valid discount code reduces total price', async ({ page }) => {
  152 |     const userSession = await getUserSession();
  153 |     await injectSession(page, userSession);
  154 | 
  155 |     await page.goto(`/buy.html?product=${TEST_PRODUCT_ID}`);
  156 |     await page.waitForTimeout(4000);
  157 | 
  158 |     // Find discount input field
  159 |     const discountInput = page.locator(
  160 |       'input[placeholder*="discount" i], input[placeholder*="code" i], #discount-input, #coupon-input'
  161 |     ).first();
  162 | 
  163 |     if (await discountInput.isVisible()) {
  164 |       await discountInput.fill('TESTDEAL50');
  165 | 
  166 |       // Click Apply button
  167 |       const applyBtn = page.locator(
  168 |         'button:has-text("Apply"), button:has-text("Validate"), #apply-discount'
  169 |       ).first();
  170 |       await applyBtn.click();
  171 |       await page.waitForTimeout(2000);
  172 | 
  173 |       // Discount of ₹50 should appear
  174 |       await expect(page.locator('text=-50, text=50, text=TESTDEAL50').first()).toBeVisible({ timeout: 5000 });
  175 |     } else {
  176 |       test.skip();
  177 |     }
  178 |   });
  179 | 
  180 |   test('applying inactive discount code shows error', async ({ page }) => {
  181 |     const userSession = await getUserSession();
  182 |     await injectSession(page, userSession);
  183 | 
  184 |     await page.goto(`/buy.html?product=${TEST_PRODUCT_ID}`);
  185 |     await page.waitForTimeout(4000);
  186 | 
  187 |     const discountInput = page.locator(
  188 |       'input[placeholder*="discount" i], input[placeholder*="code" i], #discount-input'
  189 |     ).first();
  190 | 
  191 |     if (await discountInput.isVisible()) {
  192 |       await discountInput.fill('EXPIRED10');
  193 | 
  194 |       const applyBtn = page.locator(
  195 |         'button:has-text("Apply"), button:has-text("Validate"), #apply-discount'
  196 |       ).first();
  197 |       await applyBtn.click();
  198 |       await page.waitForTimeout(2000);
  199 | 
  200 |       // An error message should appear
  201 |       await expect(
  202 |         page.locator('.error, .toast-error, [class*="error"], text=invalid, text=expired, text=not valid').first()
  203 |       ).toBeVisible({ timeout: 5000 });
  204 |     } else {
  205 |       test.skip();
  206 |     }
  207 |   });
  208 | 
  209 |   test('applying maxed-out discount code shows error', async ({ page }) => {
  210 |     const userSession = await getUserSession();
  211 |     await injectSession(page, userSession);
  212 | 
  213 |     await page.goto(`/buy.html?product=${TEST_PRODUCT_ID}`);
  214 |     await page.waitForTimeout(4000);
  215 | 
  216 |     const discountInput = page.locator(
  217 |       'input[placeholder*="discount" i], input[placeholder*="code" i], #discount-input'
  218 |     ).first();
  219 | 
  220 |     if (await discountInput.isVisible()) {
  221 |       await discountInput.fill('MAXED20');
  222 | 
  223 |       const applyBtn = page.locator(
  224 |         'button:has-text("Apply"), button:has-text("Validate"), #apply-discount'
  225 |       ).first();
  226 |       await applyBtn.click();
  227 |       await page.waitForTimeout(2000);
  228 | 
  229 |       // Error about max uses exceeded
  230 |       await expect(
  231 |         page.locator('.error, .toast-error, [class*="error"], text=expired, text=max, text=limit').first()
  232 |       ).toBeVisible({ timeout: 5000 });
  233 |     } else {
  234 |       test.skip();
  235 |     }
  236 |   });
  237 | 
  238 |   test('Razorpay checkout button is present (payment modal test)', async ({ page }) => {
  239 |     const userSession = await getUserSession();
  240 |     await injectSession(page, userSession);
  241 | 
  242 |     await page.goto(`/buy.html?product=${TEST_PRODUCT_ID}`);
```