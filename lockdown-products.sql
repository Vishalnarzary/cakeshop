-- ==============================================================================
-- CARAMEL CAKE SHOP: SECURITY PATCH
-- ==============================================================================
-- This script patches a critical security vulnerability where any logged-in 
-- user could potentially update the products table directly, bypassing the 
-- secure `reserve_stock` RPC function.

-- 1. Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can update product quantity" ON public.products;

-- Note: The products table already has "Admins can update products" which correctly
-- restricts direct updates to admins. Stock reservations and deductions will 
-- continue to work perfectly because they are handled securely via the 
-- `reserve_stock` and `clear_reservation` RPC functions (which run with 
-- SECURITY DEFINER and bypass RLS automatically).
