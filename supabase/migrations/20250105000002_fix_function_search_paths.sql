-- Fix for "Function Search Path Mutable" warning
-- Explictly set search_path to public to prevent search_path hijacking attacks

-- 1. delete_user
ALTER FUNCTION delete_user() SET search_path = public;

-- 2. handle_updated_at
ALTER FUNCTION handle_updated_at() SET search_path = public;

-- 3. handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;
