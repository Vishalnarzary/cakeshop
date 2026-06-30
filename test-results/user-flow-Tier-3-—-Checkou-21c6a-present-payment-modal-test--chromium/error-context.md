# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-flow.spec.js >> Tier 3 — Checkout (Buy Page) >> Razorpay checkout button is present (payment modal test)
- Location: tests\user-flow.spec.js:238:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has-text("Pay"), button:has-text("Place Order"), button:has-text("Order"), #pay-btn, #submit-order').first()
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('button:has-text("Pay"), button:has-text("Place Order"), button:has-text("Order"), #pay-btn, #submit-order').first()

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
  243 |     await page.waitForTimeout(4000);
  244 | 
  245 |     // The Pay / Place Order button must exist and be visible
  246 |     const payBtn = page.locator(
  247 |       'button:has-text("Pay"), button:has-text("Place Order"), button:has-text("Order"), #pay-btn, #submit-order'
  248 |     ).first();
  249 | 
> 250 |     await expect(payBtn).toBeVisible({ timeout: 8000 });
      |                          ^ Error: expect(locator).toBeVisible() failed
  251 |   });
  252 | });
  253 | 
  254 | // ─── Discount Delivery Fee Parity Test ───────────────────────
  255 | test.describe('Tier 3 — Business Logic Sanity', () => {
  256 |   test('delivery fee is non-negative for any valid distance', async ({ request }) => {
  257 |     // Test the API create-order endpoint doesn't return negative amounts
  258 |     // We just verify the endpoint is structurally correct by testing with no auth
  259 |     const res = await request.post('/api/create-order', {
  260 |       data: {
  261 |         product_id: TEST_PRODUCT_ID,
  262 |         quantity: 1,
  263 |         address_id: '00000000-0000-0000-0000-000000000000',
  264 |         delivery_speed: 'instant'
  265 |       },
  266 |       headers: {
  267 |         'Authorization': 'Bearer invalid-token'
  268 |       }
  269 |     });
  270 |     // Should get 401, not 500 (no server crash)
  271 |     expect(res.status()).not.toBe(500);
  272 |   });
  273 | });
  274 | 
```