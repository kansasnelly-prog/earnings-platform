-- Create RPC function to increment nellycoins atomically
-- This function is used by the admin minting engine

CREATE OR REPLACE FUNCTION increment_nellycoins(user_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET nellycoins = nellycoins + 1
  WHERE email = user_email;
  RETURN (SELECT nellycoins FROM public.profiles WHERE email = user_email);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_nellycoins(text) TO authenticated;
