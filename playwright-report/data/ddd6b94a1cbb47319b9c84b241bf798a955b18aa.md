# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-flow.spec.js >> Tier 3 — Homepage >> out-of-stock products show disabled buy button
- Location: tests\user-flow.spec.js:48:3

# Error details

```
TimeoutError: page.goto: Timeout 10000ms exceeded.
Call log:
  - navigating to "https://caramelcake.vercel.app/", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - link "C Caramel" [ref=e3] [cursor=pointer]:
      - /url: index.html
      - generic [ref=e4]: C
      - generic [ref=e5]: Caramel
    - link "Home" [ref=e7] [cursor=pointer]:
      - /url: index.html
    - link "Sign In" [ref=e9] [cursor=pointer]:
      - /url: login.html
  - generic [ref=e11]:
    - generic:
      - generic: Kolkata's Finest
      - heading "Caramel" [level=2]
      - paragraph: Cheese Cakes
    - generic:
      - generic: The Craft
      - heading "Handcrafted" [level=2]
      - paragraph: Every layer built with precision and quiet devotion
    - generic:
      - generic: Our Ingredients
      - heading "Pure" [level=2]
      - paragraph: No artificial flavors. No shortcuts. No compromises.
    - generic:
      - generic: Our Promise
      - heading "Natural" [level=2]
      - paragraph: Sweetened with jaggery & mishri — never refined sugar
    - generic:
      - generic: Scroll
      - img
    - generic: 057 / 231
    - button "Order Now" [ref=e15] [cursor=pointer]
  - generic [ref=e17]:
    - generic [ref=e18]: Free delivery on all orders above ₹100 up to 6km
    - generic [ref=e19]:
      - generic [ref=e20]: Available Now
      - heading "Our Menu" [level=1] [ref=e21]
      - paragraph [ref=e22]: stocks renewed everyday
    - generic [ref=e23]:
      - generic [ref=e24] [cursor=pointer]:
        - img "Caramel cheese cake small" [ref=e26]
        - generic [ref=e27]:
          - generic [ref=e28]:
            - generic [ref=e29]: ₹65
            - generic [ref=e30]: Caramel cheese cake small
          - generic [ref=e31]:
            - generic [ref=e33]: i
            - generic [ref=e34]: Only 5 left!
            - button "Shop Closed" [disabled] [ref=e35]
      - generic [ref=e36] [cursor=pointer]:
        - img "caramel cheese cake medium" [ref=e38]
        - generic [ref=e39]:
          - generic [ref=e40]:
            - generic [ref=e41]: ₹230
            - generic [ref=e42]: caramel cheese cake medium
          - generic [ref=e43]:
            - generic [ref=e45]: i
            - generic [ref=e46]: Only 2 left!
            - button "Shop Closed" [disabled] [ref=e47]
      - generic [ref=e48] [cursor=pointer]:
        - img "caramel cheese cake full" [ref=e50]
        - generic [ref=e51]:
          - generic [ref=e52]:
            - generic [ref=e53]: ₹475
            - generic [ref=e54]: caramel cheese cake full
          - generic [ref=e55]:
            - generic [ref=e57]: i
            - generic [ref=e58]: Only 1 left!
            - button "Shop Closed" [disabled] [ref=e59]
  - contentinfo [ref=e60]:
    - generic [ref=e62]:
      - button "Preorder" [ref=e63] [cursor=pointer]
      - button "Contact us" [ref=e64] [cursor=pointer]
  - generic:
    - generic:
      - generic:
        - heading "How to reach us" [level=3]
        - button "✕"
      - generic:
        - paragraph:
          - text: There are two ways to preorder or contact us. Simply send us a message saying
          - strong: "\"Preorder\""
          - text: .
        - link "📸 Direct message on Instagram":
          - /url: https://instagram.com/caramelcakekolkata
        - link "✉️ Email Us":
          - /url: mailto:caramelcakekolkata@gmail.com?subject=Preorder
```

# Test source

```ts
  1   | // @ts-check
  2   | /**
  3   |  * TIER 3 — User Flow Tests
  4   |  *
  5   |  * These tests simulate a real user's journey:
  6   |  * - Browsing the homepage + product lightbox
  7   |  * - Checking the orders page (with session)
  8   |  * - Visiting buy.html with a valid product
  9   |  * - Applying discount codes (valid + invalid)
  10  |  * - Verifying checkout UI (Razorpay modal trigger)
  11  |  *
  12  |  * NOTE: Full payment simulation (typing card number in Razorpay)
  13  |  * requires Razorpay Test Mode keys to be set as env vars.
  14  |  * If not set, those specific tests are skipped gracefully.
  15  |  */
  16  | 
  17  | const { test, expect } = require('@playwright/test');
  18  | const { getUserSession, injectSession } = require('./helpers/auth');
  19  | 
  20  | const TEST_PRODUCT_ID = '11111111-1111-1111-1111-111111111111';
  21  | 
  22  | // ─── Homepage User Flow ───────────────────────────────────────
  23  | test.describe('Tier 3 — Homepage', () => {
  24  |   test('loads product cards from database', async ({ page }) => {
  25  |     await page.goto('/');
  26  |     // Wait for products to load (they come from Supabase)
  27  |     await page.waitForTimeout(4000);
  28  | 
  29  |     // There should be at least one product card visible
  30  |     const cards = page.locator('.product-card, [class*="product"], .cake-card');
  31  |     const count = await cards.count();
  32  |     expect(count).toBeGreaterThan(0);
  33  |   });
  34  | 
  35  |   test('clicking a product card opens the lightbox', async ({ page }) => {
  36  |     await page.goto('/');
  37  |     await page.waitForTimeout(4000);
  38  | 
  39  |     // Click the first product card
  40  |     const firstCard = page.locator('.product-card, [class*="product-card"]').first();
  41  |     await firstCard.click();
  42  | 
  43  |     // Lightbox / modal should appear
  44  |     const lightbox = page.locator('#lightbox, .lightbox, [class*="modal"], [class*="lightbox"]').first();
  45  |     await expect(lightbox).toBeVisible({ timeout: 5000 });
  46  |   });
  47  | 
  48  |   test('out-of-stock products show disabled buy button', async ({ page }) => {
> 49  |     await page.goto('/');
      |                ^ TimeoutError: page.goto: Timeout 10000ms exceeded.
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
  105 |     const content = page.locator('.order-card, [class*="order"], :text("No orders"), :text("Browse")').first();
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
  142 |     await expect(page.locator('text=500').first()).toBeVisible({ timeout: 5000 });
  143 | 
  144 |     // Timer should be visible (10:00 countdown)
  145 |     const timer = page.locator('[id*="timer"], [class*="timer"], :text("remaining")').first();
  146 |     await expect(timer).toBeVisible({ timeout: 5000 }).catch(() => {
  147 |       // Timer might use different approach — skip if not found
  148 |     });
  149 |   });
```