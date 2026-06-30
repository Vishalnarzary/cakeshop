/**
 * auth.js — Session injection helper for CI/CD tests
 *
 * Uses the Supabase Service Role key to create/retrieve test users
 * and inject their sessions into the Playwright browser context.
 * This bypasses the OTP email flow entirely.
 */

const { createClient } = require('@supabase/supabase-js');

const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'https://vaevoajiwbygpsdzxcxx.supabase.co';
const TEST_SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const TEST_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY;

// The LIVE site URL — tests run against the deployed Vercel site
const SITE_URL = process.env.SITE_URL || 'https://caramelcake.vercel.app';

/**
 * Creates or retrieves the test admin user in the TEST Supabase project,
 * signs them in, and returns their session tokens.
 */
async function getAdminSession() {
  const serviceClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Try to create the test admin user (idempotent)
  const testAdminEmail = 'ci-admin@caramelcake.test';
  const testAdminPassword = 'CITestAdmin123!';

  // Create user via Admin API (won't fail if already exists)
  await serviceClient.auth.admin.createUser({
    email: testAdminEmail,
    password: testAdminPassword,
    email_confirm: true, // skip OTP confirmation
    user_metadata: { name: 'CI Admin' }
  });

  // Promote to admin role
  const { data: userData } = await serviceClient.auth.admin.listUsers();
  const adminUser = userData?.users?.find(u => u.email === testAdminEmail);
  if (adminUser) {
    await serviceClient
      .from('profiles')
      .upsert({ id: adminUser.id, email: testAdminEmail, name: 'CI Admin', role: 'admin' });
  }

  // Sign in to get a real session token
  const anonClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);
  const { data: session, error } = await anonClient.auth.signInWithPassword({
    email: testAdminEmail,
    password: testAdminPassword,
  });

  if (error) throw new Error(`Admin login failed: ${error.message}`);
  return session.session;
}

/**
 * Creates or retrieves the test regular user, signs them in,
 * and returns their session tokens.
 */
async function getUserSession() {
  const serviceClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const testUserEmail = 'ci-user@caramelcake.test';
  const testUserPassword = 'CITestUser123!';

  await serviceClient.auth.admin.createUser({
    email: testUserEmail,
    password: testUserPassword,
    email_confirm: true,
    user_metadata: { name: 'CI User' }
  });

  const anonClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);
  const { data: session, error } = await anonClient.auth.signInWithPassword({
    email: testUserEmail,
    password: testUserPassword,
  });

  if (error) throw new Error(`User login failed: ${error.message}`);
  return session.session;
}

/**
 * Injects a Supabase session into the Playwright page's localStorage.
 * Call this before page.goto() so the page loads as already logged in.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} session - Supabase session object from signInWithPassword
 */
async function injectSession(page, session) {
  const storageKey = `sb-${TEST_SUPABASE_URL.match(/\/\/([^.]+)/)[1]}-auth-token`;
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, {
    key: storageKey,
    value: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: 'bearer',
      user: session.user,
    }
  });
}

module.exports = { getAdminSession, getUserSession, injectSession, SITE_URL };
