-- ============================================================
--  Cake Shop — SUPABASE SQL SCHEMA
--  Run this entire script in your Supabase SQL Editor
--  (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity    INTEGER NOT NULL DEFAULT 0,
  image_url   TEXT,
  emoji       TEXT DEFAULT '📦',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. ADDRESSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  street         TEXT,
  city           TEXT,
  state          TEXT,
  pincode        TEXT,
  full_address   TEXT,
  building_floor TEXT,
  distance       NUMERIC(10, 2),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id         UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  address_id         UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  quantity           INTEGER NOT NULL DEFAULT 1,
  payment_proof_url  TEXT,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  delivery_speed     TEXT DEFAULT 'instant',
  discount_code      TEXT,
  discount_amount    INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4.1. DISCOUNT CODES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  amount          NUMERIC(10, 2) NOT NULL,
  min_order_value NUMERIC(10, 2) DEFAULT 0,
  max_uses        INTEGER DEFAULT 100,
  used_count      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4.2. STORE SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  id          TEXT PRIMARY KEY,
  is_open     BOOLEAN DEFAULT true,
  announcement TEXT DEFAULT ''
);

-- ============================================================
-- 4.5. STOCK RESERVATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- 4.6. ENABLE REALTIME ON PRODUCTS
-- This allows index.html to receive live stock updates.
-- Run this in Supabase SQL Editor.
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- PROFILES: Users can read their own profile; admins can read all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Allow self profile insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- PRODUCTS: Everyone can read; only admins can write
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- Allow authenticated users to decrement stock (for order submission)
-- POLICY REMOVED: This was a security vulnerability. Stock updates should only happen via reserve_stock RPC.

-- ADDRESSES: Users manage their own addresses
CREATE POLICY "Users can view own addresses"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses"
  ON public.addresses FOR SELECT
  USING (public.is_admin());

-- ORDERS: Users see own orders; admins see all
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update order status"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- STOCK RESERVATIONS: Users manage own reservations
CREATE POLICY "Users can manage own reservations"
  ON public.stock_reservations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DISCOUNT CODES: Anyone can read, only admins can manage
CREATE POLICY "Anyone can view discount codes"
  ON public.discount_codes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage discount codes"
  ON public.discount_codes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- STORE SETTINGS: Anyone can read, only admins can manage
CREATE POLICY "Anyone can view store settings"
  ON public.store_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage store settings"
  ON public.store_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 6. STORAGE BUCKETS
-- ============================================================
-- Run these if the buckets don't exist yet.
-- Or create them via Dashboard → Storage → New Bucket

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Anyone can read public files
CREATE POLICY "Public read payment-proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated upload payment-proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

CREATE POLICY "Public read product-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admin upload product-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 7. SEED: Create initial admin account
-- ============================================================
-- IMPORTANT: After running this SQL, go to Authentication → Users
-- and manually create a user with your admin email & password.
-- Then run this UPDATE to promote them to admin:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'your-admin-email@example.com';
--
-- ============================================================

-- ============================================================
-- 8. RPC FUNCTIONS FOR STOCK MANAGEMENT
-- ============================================================

-- Function 1: Cleanup Expired Reservations (ATOMIC)
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Using a CTE to atomically delete expired reservations and aggregate their quantities
  WITH deleted_reservations AS (
    DELETE FROM public.stock_reservations 
    WHERE expires_at < NOW()
    RETURNING product_id, quantity
  )
  UPDATE public.products p
  SET quantity = p.quantity + dr.total_qty
  FROM (
    SELECT product_id, SUM(quantity) as total_qty 
    FROM deleted_reservations 
    GROUP BY product_id
  ) dr
  WHERE p.id = dr.product_id;
END;
$$;

-- Function 2: Reserve Stock (ATOMIC)
CREATE OR REPLACE FUNCTION public.reserve_stock(p_user_id UUID, p_product_id UUID, p_req_quantity INT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_existing_qty INT;
  v_diff INT;
  v_updated_product_id UUID;
BEGIN
  PERFORM public.cleanup_expired_reservations();
  
  -- Check if user already has a reservation
  SELECT quantity INTO v_existing_qty FROM public.stock_reservations 
  WHERE user_id = p_user_id AND product_id = p_product_id;
  
  IF FOUND THEN
    v_diff := p_req_quantity - v_existing_qty;
    
    -- Atomic update with WHERE clause to prevent negative stock
    UPDATE public.products 
    SET quantity = quantity - v_diff 
    WHERE id = p_product_id AND quantity >= v_diff
    RETURNING id INTO v_updated_product_id;
    
    IF FOUND THEN
      UPDATE public.stock_reservations 
      SET quantity = p_req_quantity, expires_at = NOW() + INTERVAL '5 minutes' 
      WHERE user_id = p_user_id AND product_id = p_product_id;
      RETURN json_build_object('success', true);
    ELSE
      RETURN json_build_object('success', false, 'message', 'Not enough stock available');
    END IF;
  ELSE
    -- New reservation
    -- Atomic update with WHERE clause to prevent negative stock
    UPDATE public.products 
    SET quantity = quantity - p_req_quantity 
    WHERE id = p_product_id AND quantity >= p_req_quantity
    RETURNING id INTO v_updated_product_id;
    
    IF FOUND THEN
      INSERT INTO public.stock_reservations (user_id, product_id, quantity, expires_at) 
      VALUES (p_user_id, p_product_id, p_req_quantity, NOW() + INTERVAL '5 minutes');
      RETURN json_build_object('success', true);
    ELSE
      RETURN json_build_object('success', false, 'message', 'Not enough stock available');
    END IF;
  END IF;
END;
$$;

-- Function 3: Clear Reservation on Order Submit
CREATE OR REPLACE FUNCTION public.clear_reservation(p_user_id UUID, p_product_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.stock_reservations WHERE user_id = p_user_id AND product_id = p_product_id;
END;
$$;

-- Function 4: Actively Cancel Abandoned Checkout (ATOMIC)
CREATE OR REPLACE FUNCTION public.cancel_reservation(p_user_id UUID, p_product_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_qty INT;
BEGIN
  -- Atomically delete and return the quantity.
  -- This guarantees it only executes ONCE even if called simultaneously by different events.
  DELETE FROM public.stock_reservations 
  WHERE user_id = p_user_id AND product_id = p_product_id
  RETURNING quantity INTO v_qty;

  IF FOUND THEN
    UPDATE public.products SET quantity = quantity + v_qty WHERE id = p_product_id;
  END IF;
END;
$$;

-- Optional: seed demo products
INSERT INTO public.products (name, description, price, quantity, emoji)
VALUES
  ('Wireless Headphones', 'Premium noise-cancelling over-ear headphones with 40hr battery.', 4999, 15, '🎧'),
  ('Mechanical Keyboard', 'RGB backlit 75% layout with tactile switches.', 6499, 8, '⌨️'),
  ('USB-C Hub (7-in-1)', 'Expand connectivity with HDMI, USB 3.0, SD card, and more.', 2299, 25, '🔌'),
  ('Laptop Stand', 'Aluminium adjustable stand, compatible with all laptops.', 1799, 3, '💻')
ON CONFLICT DO NOTHING;
