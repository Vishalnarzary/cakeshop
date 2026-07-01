-- ============================================================
-- SEED DATA FOR CI/CD TEST DATABASE
-- Run this in the Supabase SQL Editor of your TEST project
-- (https://vaevoajiwbygpsdzxcxx.supabase.co)
-- ============================================================

-- 1. Reset all test data first (safe to run multiple times)
TRUNCATE public.orders, public.stock_reservations, public.addresses,
         public.discount_codes, public.products, public.store_settings RESTART IDENTITY CASCADE;

-- 2. Store Settings (shop must be open for checkout tests)
INSERT INTO public.store_settings (id, is_open, announcement)
VALUES ('shop_status', true, '')
ON CONFLICT (id) DO UPDATE SET is_open = true, announcement = '';

-- 3. Seed test product (known UUID so tests can reference it)
INSERT INTO public.products (id, name, description, price, quantity, emoji)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Test Caramel Cake',
  'A delicious test cake used by the CI/CD pipeline.',
  500.00,
  100,
  '🎂'
) ON CONFLICT (id) DO UPDATE SET quantity = 100, price = 500.00;

-- 4. Seed out-of-stock product (for testing sold-out UI)
INSERT INTO public.products (id, name, description, price, quantity, emoji)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Sold Out Cake',
  'This item is out of stock.',
  300.00,
  0,
  '🚫'
) ON CONFLICT (id) DO UPDATE SET quantity = 0;

-- 5. Seed discount codes
INSERT INTO public.discount_codes (id, code, amount, min_order_value, max_uses, used_count, is_active)
VALUES
  -- Valid discount code
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TESTDEAL50', 50.00, 100.00, 999, 0, true),
  -- Inactive discount code
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'EXPIRED10', 10.00, 0, 100, 0, false),
  -- Maxed out discount code
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'MAXED20', 20.00, 0, 5, 5, true),
  -- Min order not met discount
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'BIGORDER100', 100.00, 5000.00, 999, 0, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- NOTE: Test users (admin + regular user) CANNOT be seeded
-- via SQL because Supabase auth.users requires the Auth API.
-- The CI pipeline creates them programmatically using the
-- service role key in tests/helpers/auth.js
-- ============================================================
