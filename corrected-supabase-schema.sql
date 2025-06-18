-- Supabase schema for profiles table
-- Run this in your Supabase SQL editor to create/update the profiles table

-- Drop the existing table and recreate with proper structure
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table that works with the new registration flow
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT UNIQUE,
    username TEXT,
    email TEXT,
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create unique index on wallet_address for faster queries
CREATE UNIQUE INDEX IF NOT EXISTS profiles_wallet_address_idx ON public.profiles(wallet_address) WHERE wallet_address IS NOT NULL;

-- Create index on auth_user_id for faster queries
CREATE INDEX IF NOT EXISTS profiles_auth_user_id_idx ON public.profiles(auth_user_id);

-- Create index on email for faster queries
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all profile operations" ON public.profiles;

-- Create simple permissive policy for development/testing
-- In production, you might want more restrictive policies
CREATE POLICY "Allow all profile operations for now" ON public.profiles
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create transactions table (updated to reference profiles correctly)
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_address TEXT,
    from_amount DECIMAL(20, 8),
    from_currency TEXT,
    to_amount DECIMAL(20, 8),
    to_currency TEXT,
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    exchange_rate DECIMAL(20, 8),
    fee TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS transactions_transaction_id_idx ON public.transactions(transaction_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_wallet_address_idx ON public.transactions(wallet_address);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON public.transactions(status);

-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for transactions
CREATE POLICY "Allow all transaction operations for now" ON public.transactions
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Grant permissions for transactions
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO anon;

-- Create trigger for transactions updated_at
DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;
CREATE TRIGGER transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 