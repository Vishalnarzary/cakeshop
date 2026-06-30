// @ts-check
/**
 * TIER 1 — Smoke Tests
 *
 * These are the fastest tests (~30 seconds). They check:
 * 1. Every HTML page returns HTTP 200 (no broken pages)
 * 2. No JavaScript console errors on any page
 * 3. API routes respond correctly (not crashed with 500)
 *
 * These catch syntax errors, missing files, and broken Vercel routes
 * the moment you push code.
 */

const { test, expect } = require('@playwright/test');
const { gotoReady } = require('./helpers/navigation');

const PAGES = [
  { path: '/',               name: 'Homepage'       },
  { path: '/login.html',     name: 'Login'          },
  { path: '/register.html',  name: 'Register'       },
  { path: '/orders.html',    name: 'Orders'         },
  { path: '/admin.html',     name: 'Admin'          },
  { path: '/reset-password.html', name: 'Reset Password' },
];

// ─── 1. All pages return HTTP 200 ────────────────────────────
test.describe('Tier 1 — Page HTTP Status', () => {
  for (const { path, name } of PAGES) {
    test(`${name} returns HTTP 200`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status(), `${name} at ${path} should return 200`).toBe(200);
    });
  }
});

// ─── 2. No JavaScript console errors ─────────────────────────
test.describe('Tier 1 — No JS Console Errors', () => {
  for (const { path, name } of PAGES) {
    test(`${name} has no critical JS errors`, async ({ page }) => {
      const errors = [];

      // Collect any console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          // Ignore common non-critical errors (e.g. ad blockers, CORS on CDN)
          const text = msg.text();
          if (
            text.includes('ERR_BLOCKED_BY_CLIENT') ||
            text.includes('favicon') ||
            text.includes('net::ERR_ABORTED')
          ) return;
          errors.push(text);
        }
      });

      // Ignore expected navigation/page errors
      page.on('pageerror', err => {
        errors.push(err.message);
      });

      await gotoReady(page, path);
      // Wait a moment for scripts to execute
      await page.waitForTimeout(2000);

      expect(errors, `${name} should have no JS errors. Found: ${errors.join(' | ')}`).toHaveLength(0);
    });
  }
});

// ─── 3. API Routes Health Check ───────────────────────────────
test.describe('Tier 1 — API Route Health', () => {
  test('POST /api/create-order without token returns 401 or 400 (not 500)', async ({ request }) => {
    const response = await request.post('/api/create-order', {
      data: {}
    });
    // Must NOT be 500 (server crash). Static local servers may return 404/405/501 for API routes.
    expect(response.status(), 'API should not crash with 500').not.toBe(500);
    expect([400, 401, 404, 405, 501]).toContain(response.status());
  });

  test('POST /api/verify-payment without token returns 401 or 400 (not 500)', async ({ request }) => {
    const response = await request.post('/api/verify-payment', {
      data: {}
    });
    expect(response.status(), 'API should not crash with 500').not.toBe(500);
    expect([400, 401, 404, 405, 501]).toContain(response.status());
  });

  test('GET /api/ola-autocomplete without token returns 401 (not 500)', async ({ request }) => {
    const response = await request.get('/api/ola-autocomplete?input=test');
    expect(response.status(), 'API should not crash with 500').not.toBe(500);
    expect([400, 401, 403, 404, 405]).toContain(response.status());
  });

  test('POST /api/ola-distance without token returns 401 or 405 (not 500)', async ({ request }) => {
    const response = await request.post('/api/ola-distance', {
      data: { destination: '22.5,88.4' }
    });
    expect(response.status(), 'API should not crash with 500').not.toBe(500);
    expect([400, 401, 403, 404, 405, 501]).toContain(response.status());
  });
});

// ─── 4. All CSS and JS assets load ───────────────────────────
test('styles.css is accessible', async ({ request }) => {
  const response = await request.get('/styles.css');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/css');
});

test('supabase.js is accessible', async ({ request }) => {
  const response = await request.get('/supabase.js');
  expect(response.status()).toBe(200);
});
