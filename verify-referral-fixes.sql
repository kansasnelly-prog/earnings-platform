-- Verification Script: OPT Referral System Fixes
-- This script verifies that the referral code fixes have been applied correctly

-- ============================================
-- TEST 1: Check for NULL referral codes
-- ============================================
SELECT 
  'TEST 1: NULL Referral Codes' as test_name,
  COUNT(*) as null_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result
FROM users
WHERE referral_code IS NULL;

-- ============================================
-- TEST 2: Check for invalid format (not OPT-XXXXXX)
-- ============================================
SELECT 
  'TEST 2: Invalid Format (not OPT-XXXXXX)' as test_name,
  COUNT(*) as invalid_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result
FROM users
WHERE referral_code !~ '^OPT-[A-Z0-9]{6}$';

-- ============================================
-- TEST 3: Check for duplicate referral codes
-- ============================================
SELECT 
  'TEST 3: Duplicate Referral Codes' as test_name,
  COUNT(*) as duplicate_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result
FROM (
  SELECT referral_code, COUNT(*) as count
  FROM users
  GROUP BY referral_code
  HAVING COUNT(*) > 1
) duplicates;

-- ============================================
-- TEST 4: Verify NOT NULL constraint exists
-- ============================================
SELECT 
  'TEST 4: NOT NULL Constraint' as test_name,
  CASE 
    WHEN is_nullable = 'NO' THEN 'PASS'
    ELSE 'FAIL'
  END as result
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'referral_code';

-- ============================================
-- TEST 5: Verify check constraint exists
-- ============================================
SELECT 
  'TEST 5: Format Check Constraint' as test_name,
  COUNT(*) as constraint_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%referral_code%';

-- ============================================
-- TEST 6: Verify trigger exists for insert
-- ============================================
SELECT 
  'TEST 6: Insert Trigger' as test_name,
  COUNT(*) as trigger_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result
FROM information_schema.triggers
WHERE trigger_name = 'ensure_referral_code_trigger'
  AND event_object_table = 'users';

-- ============================================
-- TEST 7: Verify trigger exists for update
-- ============================================
SELECT 
  'TEST 7: Update Trigger' as test_name,
  COUNT(*) as trigger_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result
FROM information_schema.triggers
WHERE trigger_name = 'ensure_referral_code_update_trigger'
  AND event_object_table = 'users';

-- ============================================
-- TEST 8: Sample of recent users with referral codes
-- ============================================
SELECT 
  'TEST 8: Sample Recent Users' as test_name,
  email,
  referral_code,
  created_at,
  CASE 
    WHEN referral_code ~ '^OPT-[A-Z0-9]{6}$' THEN 'VALID'
    ELSE 'INVALID'
  END as format_check
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- TEST 9: Summary statistics
-- ============================================
SELECT 
  'TEST 9: Summary Statistics' as test_name,
  COUNT(*) as total_users,
  COUNT(CASE WHEN referral_code IS NULL THEN 1 END) as null_codes,
  COUNT(CASE WHEN referral_code ~ '^OPT-[A-Z0-9]{6}$' THEN 1 END) as valid_opt_codes,
  COUNT(CASE WHEN referral_code !~ '^OPT-[A-Z0-9]{6}$' AND referral_code IS NOT NULL THEN 1 END) as invalid_codes
FROM users;

-- ============================================
-- TEST 10: Test referral code generation function
-- ============================================
SELECT 
  'TEST 10: Generate Test Code' as test_name,
  generate_unique_referral_code() as test_code,
  CASE 
    WHEN generate_unique_referral_code() ~ '^OPT-[A-Z0-9]{6}$' THEN 'PASS'
    ELSE 'FAIL'
  END as result;
