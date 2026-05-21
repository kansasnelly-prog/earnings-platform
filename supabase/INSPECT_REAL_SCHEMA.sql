-- ===========================================
-- PHASE 2: REAL SCHEMA INSPECTION
-- DO NOT ASSUME COLUMNS - INSPECT ACTUAL SCHEMA
-- ===========================================

-- 1. Get all tables in public schema
SELECT 
    '=== ALL TABLES IN PUBLIC SCHEMA ===' as section;

SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Get columns for users table
SELECT 
    '=== USERS TABLE COLUMNS ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Get columns for training_accounts table
SELECT 
    '=== TRAINING_ACCOUNTS TABLE COLUMNS ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'training_accounts'
ORDER BY ordinal_position;

-- 4. Get columns for tasks table
SELECT 
    '=== TASKS TABLE COLUMNS ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'tasks'
ORDER BY ordinal_position;

-- 5. Get columns for transactions table
SELECT 
    '=== TRANSACTIONS TABLE COLUMNS ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'transactions'
ORDER BY ordinal_position;

-- 6. Get columns for withdrawals table
SELECT 
    '=== WITHDRAWALS TABLE COLUMNS ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'withdrawals'
ORDER BY ordinal_position;

-- 7. Get columns for wallets table
SELECT 
    '=== WALLETS TABLE COLUMNS ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'wallets'
ORDER BY ordinal_position;

-- 8. Get foreign key constraints
SELECT 
    '=== FOREIGN KEY CONSTRAINTS ===' as section;

SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 9. Check for profiles table (if exists)
SELECT 
    '=== PROFILES TABLE (IF EXISTS) ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 10. Check for phase2_checkpoints table (if exists)
SELECT 
    '=== PHASE2_CHECKPOINTS TABLE (IF EXISTS) ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'phase2_checkpoints'
ORDER BY ordinal_position;

-- 11. Check for training_products table (if exists)
SELECT 
    '=== TRAINING_PRODUCTS TABLE (IF EXISTS) ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'training_products'
ORDER BY ordinal_position;

-- 12. Sample data from users table (last 5)
SELECT 
    '=== SAMPLE USERS DATA (LAST 5) ===' as section;

SELECT *
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- 13. Sample data from training_accounts table (last 5)
SELECT 
    '=== SAMPLE TRAINING_ACCOUNTS DATA (LAST 5) ===' as section;

SELECT *
FROM training_accounts
ORDER BY created_at DESC
LIMIT 5;

-- 14. Check for duplicate emails across users and training_accounts
SELECT 
    '=== DUPLICATE EMAILS CHECK ===' as section;

SELECT 
    email,
    'users' as source,
    COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1

UNION ALL

SELECT 
    email,
    'training_accounts' as source,
    COUNT(*) as count
FROM training_accounts
GROUP BY email
HAVING COUNT(*) > 1;

-- 15. Check for auth_user_id relationships
SELECT 
    '=== AUTH_USER_ID RELATIONSHIPS ===' as section;

SELECT 
    u.id as user_id,
    u.email as user_email,
    u.account_type,
    ta.id as training_account_id,
    ta.email as training_account_email,
    ta.auth_user_id
FROM users u
LEFT JOIN training_accounts ta ON u.id = ta.user_id OR u.id = ta.auth_user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- 16. Check RLS policies
SELECT 
    '=== RLS POLICIES ===' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
