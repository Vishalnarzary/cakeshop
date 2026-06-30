# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-flow.spec.js >> Tier 3 — Admin Flow >> orders tab loads order table
- Location: tests\admin-flow.spec.js:126:3

# Error details

```
TimeoutError: locator.click: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Orders"), [data-tab="orders"], #tab-orders').first()

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
      - generic [ref=e17]:
        - generic [ref=e18]: Password *
        - textbox "Password *" [ref=e19]:
          - /placeholder: Enter your password
      - button "Sign In" [ref=e20] [cursor=pointer]:
        - generic [ref=e21]: Sign In
    - generic [ref=e22]:
      - text: Don't have an account?
      - link "Create one" [ref=e23] [cursor=pointer]:
        - /url: register.html
```

# Test source

```ts
  33  |   let adminSession;
  34  | 
  35  |   test.beforeAll(async () => {
  36  |     adminSession = await getAdminSession();
  37  |   });
  38  | 
  39  |   // ─── Admin Dashboard Loads ──────────────────────────────
  40  |   test('admin dashboard loads all main sections', async ({ page }) => {
  41  |     await injectSession(page, adminSession);
  42  |     await page.goto('/admin.html');
  43  |     await page.waitForLoadState('networkidle');
  44  | 
  45  |     // All four stat cards should be present
  46  |     await expect(page.locator('.stat-card, [class*="stat"]').first()).toBeVisible({ timeout: 10000 });
  47  | 
  48  |     // Navigation tabs
  49  |     await expect(page.locator('text=Products, text=Orders').first()).toBeVisible({ timeout: 5000 });
  50  |   });
  51  | 
  52  |   test('stats grid shows numeric values (not blank)', async ({ page }) => {
  53  |     await injectSession(page, adminSession);
  54  |     await page.goto('/admin.html');
  55  |     await page.waitForLoadState('networkidle');
  56  |     await page.waitForTimeout(3000);
  57  | 
  58  |     // Stats should have loaded with actual numbers
  59  |     const statValues = page.locator('.stat-value, [class*="stat-num"]');
  60  |     const count = await statValues.count();
  61  |     expect(count).toBeGreaterThan(0);
  62  |   });
  63  | 
  64  |   // ─── Shop Status Toggle ─────────────────────────────────
  65  |   test('shop open/close toggle is present and clickable', async ({ page }) => {
  66  |     await injectSession(page, adminSession);
  67  |     await page.goto('/admin.html');
  68  |     await page.waitForLoadState('networkidle');
  69  | 
  70  |     const shopToggle = page.locator('#shop-toggle');
  71  |     await expect(shopToggle).toBeAttached({ timeout: 8000 });
  72  | 
  73  |     // Record initial state
  74  |     const initialChecked = await shopToggle.isChecked();
  75  | 
  76  |     // Toggle it
  77  |     await shopToggle.click();
  78  |     await page.waitForTimeout(2000);
  79  | 
  80  |     // Should have changed
  81  |     const newChecked = await shopToggle.isChecked();
  82  |     expect(newChecked).toBe(!initialChecked);
  83  | 
  84  |     // Toggle back to restore state
  85  |     await shopToggle.click();
  86  |     await page.waitForTimeout(1000);
  87  |   });
  88  | 
  89  |   // ─── Products Tab ───────────────────────────────────────
  90  |   test('products tab loads product list', async ({ page }) => {
  91  |     await injectSession(page, adminSession);
  92  |     await page.goto('/admin.html');
  93  |     await page.waitForLoadState('networkidle');
  94  | 
  95  |     // Click Products tab
  96  |     const productsTab = page.locator('button:has-text("Products"), [data-tab="products"], #tab-products').first();
  97  |     await productsTab.click();
  98  |     await page.waitForTimeout(3000);
  99  | 
  100 |     // Product list should have at least the seeded test product
  101 |     const productItems = page.locator('.product-card, .product-item, [class*="product-row"], tr').first();
  102 |     await expect(productItems).toBeVisible({ timeout: 8000 });
  103 |   });
  104 | 
  105 |   test('can open add product form', async ({ page }) => {
  106 |     await injectSession(page, adminSession);
  107 |     await page.goto('/admin.html');
  108 |     await page.waitForLoadState('networkidle');
  109 | 
  110 |     // Click Products tab
  111 |     await page.locator('button:has-text("Products"), [data-tab="products"], #tab-products').first().click();
  112 |     await page.waitForTimeout(1000);
  113 | 
  114 |     // Click Add Product button
  115 |     const addBtn = page.locator('button:has-text("Add"), button:has-text("New Product"), #add-product-btn').first();
  116 |     await addBtn.click();
  117 |     await page.waitForTimeout(500);
  118 | 
  119 |     // A form or modal should appear
  120 |     await expect(
  121 |       page.locator('input[placeholder*="name" i], input[name="name"], #product-name').first()
  122 |     ).toBeVisible({ timeout: 5000 });
  123 |   });
  124 | 
  125 |   // ─── Orders Tab ─────────────────────────────────────────
  126 |   test('orders tab loads order table', async ({ page }) => {
  127 |     await injectSession(page, adminSession);
  128 |     await page.goto('/admin.html');
  129 |     await page.waitForLoadState('networkidle');
  130 | 
  131 |     // Click Orders tab
  132 |     const ordersTab = page.locator('button:has-text("Orders"), [data-tab="orders"], #tab-orders').first();
> 133 |     await ordersTab.click();
      |                     ^ TimeoutError: locator.click: Timeout 5000ms exceeded.
  134 |     await page.waitForTimeout(3000);
  135 | 
  136 |     // Either shows orders table or "no orders" empty state
  137 |     const content = page.locator('.order-row, tr, .empty-state, text=No orders').first();
  138 |     await expect(content).toBeVisible({ timeout: 8000 });
  139 |   });
  140 | 
  141 |   test('order filter buttons exist (All, Pending, Processing, Completed)', async ({ page }) => {
  142 |     await injectSession(page, adminSession);
  143 |     await page.goto('/admin.html');
  144 |     await page.waitForLoadState('networkidle');
  145 | 
  146 |     await page.locator('button:has-text("Orders"), [data-tab="orders"], #tab-orders').first().click();
  147 |     await page.waitForTimeout(1000);
  148 | 
  149 |     // Filter buttons
  150 |     for (const filter of ['All', 'Pending']) {
  151 |       const btn = page.locator(`button:has-text("${filter}")`).first();
  152 |       await expect(btn).toBeVisible({ timeout: 5000 });
  153 |     }
  154 |   });
  155 | 
  156 |   // ─── Discounts Tab ──────────────────────────────────────
  157 |   test('discounts tab shows seeded discount codes', async ({ page }) => {
  158 |     await injectSession(page, adminSession);
  159 |     await page.goto('/admin.html');
  160 |     await page.waitForLoadState('networkidle');
  161 | 
  162 |     // Click Discounts tab
  163 |     const discountTab = page.locator('button:has-text("Discount"), [data-tab="discounts"], #tab-discounts').first();
  164 |     await discountTab.click();
  165 |     await page.waitForTimeout(3000);
  166 | 
  167 |     // Should show the TESTDEAL50 seeded code
  168 |     await expect(page.locator('text=TESTDEAL50')).toBeVisible({ timeout: 8000 });
  169 |   });
  170 | 
  171 |   test('can create a new discount code', async ({ page }) => {
  172 |     await injectSession(page, adminSession);
  173 |     await page.goto('/admin.html');
  174 |     await page.waitForLoadState('networkidle');
  175 | 
  176 |     await page.locator('button:has-text("Discount"), [data-tab="discounts"], #tab-discounts').first().click();
  177 |     await page.waitForTimeout(1000);
  178 | 
  179 |     // Fill in new discount form
  180 |     const codeInput = page.locator('input[placeholder*="code" i], input[name="code"], #discount-code').first();
  181 |     await codeInput.fill('CITEST99');
  182 | 
  183 |     const amountInput = page.locator('input[placeholder*="amount" i], input[name="amount"], #discount-amount').first();
  184 |     await amountInput.fill('99');
  185 | 
  186 |     // Submit
  187 |     const submitBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button[type="submit"]').first();
  188 |     await submitBtn.click();
  189 |     await page.waitForTimeout(3000);
  190 | 
  191 |     // New code should appear
  192 |     await expect(page.locator('text=CITEST99')).toBeVisible({ timeout: 8000 });
  193 |   });
  194 | });
  195 | 
  196 | // ─── Regular User Cannot Access Admin ─────────────────────────
  197 | test.describe('Tier 3 — Role Security', () => {
  198 |   test.skip(
  199 |     !process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
  200 |     'Skipping: TEST_SUPABASE_SERVICE_ROLE_KEY not set'
  201 |   );
  202 | 
  203 |   test('regular user injected with session cannot see admin dashboard', async ({ page }) => {
  204 |     const userSession = await getUserSession();
  205 |     await injectSession(page, userSession);
  206 | 
  207 |     await page.goto('/admin.html');
  208 |     await page.waitForLoadState('domcontentloaded');
  209 |     await page.waitForTimeout(3000);
  210 | 
  211 |     // Should be redirected to login or show access denied
  212 |     const isRedirected = page.url().includes('login.html') || page.url().includes('index.html');
  213 |     const adminVisible = await page.locator('#admin-main, .stats-grid').isVisible();
  214 | 
  215 |     expect(isRedirected || !adminVisible).toBe(true);
  216 |   });
  217 | });
  218 | 
```