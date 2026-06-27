-- Fix 1: Allow users to insert their own profile row
CREATE POLICY "Allow self profile insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Fix 2: Make sure the trigger-based insert also works (bypass RLS for the trigger function)
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
