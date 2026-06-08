-- Migration: Fix NULL referral codes for existing users
-- This migration finds users where referral_code IS NULL and generates unique OPT- codes for them

-- Step 1: Create a function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists INTEGER;
BEGIN
  LOOP
    -- Generate a new OPT-XXXXXX code
    new_code := 'OPT-' || upper(substr(md5(random()::text), 1, 6));
    
    -- Check if this code already exists
    SELECT COUNT(*) INTO code_exists
    FROM users
    WHERE referral_code = new_code;
    
    -- If code doesn't exist, return it
    IF code_exists = 0 THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update all users with NULL referral codes
UPDATE users
SET referral_code = generate_unique_referral_code()
WHERE referral_code IS NULL;

-- Step 3: Verify the update
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN referral_code IS NULL THEN 1 END) as null_referral_codes,
  COUNT(CASE WHEN referral_code LIKE 'OPT-%' THEN 1 END) as opt_format_codes
FROM users;

-- Step 4: Add NOT NULL constraint to referral_code column
ALTER TABLE users
ALTER COLUMN referral_code SET NOT NULL;

-- Step 5: Add check constraint to ensure OPT-XXXXXX format
ALTER TABLE users
ADD CONSTRAINT referral_code_format_check 
CHECK (referral_code ~ '^OPT-[A-Z0-9]{6}$');

-- Step 6: Create a trigger to automatically generate referral codes on insert
CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- If referral_code is NULL, generate one
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_unique_referral_code();
  END IF;
  
  -- Validate the format
  IF NEW.referral_code !~ '^OPT-[A-Z0-9]{6}$' THEN
    RAISE EXCEPTION 'Referral code must be in format OPT-XXXXXX (6 alphanumeric characters)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Apply the trigger before insert
DROP TRIGGER IF EXISTS ensure_referral_code_trigger ON users;
CREATE TRIGGER ensure_referral_code_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION ensure_referral_code();

-- Step 8: Apply the trigger before update
DROP TRIGGER IF EXISTS ensure_referral_code_update_trigger ON users;
CREATE TRIGGER ensure_referral_code_update_trigger
BEFORE UPDATE OF referral_code ON users
FOR EACH ROW
EXECUTE FUNCTION ensure_referral_code();
