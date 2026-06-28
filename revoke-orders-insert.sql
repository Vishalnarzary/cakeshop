-- Run this in the Supabase SQL Editor to secure the orders table

-- Revoke INSERT permission for authenticated users (only the backend with Service Role can insert)
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;

-- Verify that the updated policy is completely removed.
-- The Service Role Key bypasses RLS anyway, so the backend can still insert!

-- Ensure that users CAN still view their own orders:
-- (This should already exist, but running it again is harmless if IF NOT EXISTS was used, 
-- but since it's already there, just leave it intact.)
