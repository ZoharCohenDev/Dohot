-- Fix "Database error saving new user" during email registration.
-- Run this in Supabase Dashboard -> SQL Editor.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id                  uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name           text        NOT NULL DEFAULT '',
  business_name       text        NOT NULL DEFAULT '',
  profession          text        NOT NULL DEFAULT 'other'
                                  CHECK (profession IN (
                                    'leak_detection', 'plumber', 'electrician',
                                    'renovation', 'roofing', 'other'
                                  )),
  phone               text,
  license_number      text,
  logo_url            text,
  bio                 text,
  signature_url       text,
  default_disclaimer  text,
  certifications      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  plan                text        NOT NULL DEFAULT 'free'
                                  CHECK (plan IN ('free', 'pro')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_all" ON public.business_profiles;
CREATE POLICY "owner_all" ON public.business_profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_profiles (id, full_name, profession, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'profession', ''), 'other'),
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    profession = EXCLUDED.profession,
    phone = EXCLUDED.phone;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
