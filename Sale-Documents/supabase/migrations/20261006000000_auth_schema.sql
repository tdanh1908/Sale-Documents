-- Create ENUM for moderation status (Safely)
DO $$ BEGIN
    CREATE TYPE moderation_status AS ENUM ('pending', 'flagged', 'approved', 'masked', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter profiles table to add missing columns
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS nickname TEXT,
    ADD COLUMN IF NOT EXISTS school TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS is_public_agreed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS nickname_status moderation_status DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS school_status moderation_status DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS referral_code TEXT,
    ADD COLUMN IF NOT EXISTS utm_source TEXT,
    ADD COLUMN IF NOT EXISTS utm_medium TEXT,
    ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Safely add unique constraint on referral_code if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_referral_code_key UNIQUE(referral_code);
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN duplicate_table THEN null;
    WHEN others THEN null;
END $$;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Policies for audit_logs
DROP POLICY IF EXISTS "Audit logs are only accessible by admin" ON public.audit_logs;
CREATE POLICY "Audit logs are only accessible by admin" 
ON public.audit_logs FOR ALL 
USING (false);

-- Trigger: Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    nickname, 
    school, 
    phone, 
    is_public_agreed,
    referral_code,
    utm_source,
    utm_medium,
    utm_campaign,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'nickname',
    NEW.raw_user_meta_data->>'school',
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'is_public_agreed')::boolean, false),
    NEW.raw_user_meta_data->>'referral_code',
    NEW.raw_user_meta_data->>'utm_source',
    NEW.raw_user_meta_data->>'utm_medium',
    NEW.raw_user_meta_data->>'utm_campaign',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    nickname = EXCLUDED.nickname,
    school = EXCLUDED.school,
    phone = EXCLUDED.phone,
    is_public_agreed = EXCLUDED.is_public_agreed,
    referral_code = EXCLUDED.referral_code,
    utm_source = EXCLUDED.utm_source,
    utm_medium = EXCLUDED.utm_medium,
    utm_campaign = EXCLUDED.utm_campaign,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();
