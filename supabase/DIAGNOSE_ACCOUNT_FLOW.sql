-- ===========================================
-- ACCOUNT FLOW DIAGNOSTIC SCRIPT
-- Run this to inspect the current database state
-- ===========================================

-- 1. Check users table structure and data
SELECT 
    '=== USERS TABLE INSPECTION ===' as section;

SELECT 
    COUNT(*) as total_users,
    COUNT(DISTINCT email) as unique_emails,
    COUNT(CASE WHEN account_type = 'personal' THEN 1 END) as personal_accounts,
    COUNT(CASE WHEN account_type = 'training' THEN 1 END) as training_accounts,
    COUNT(CASE WHEN account_type = 'admin' THEN 1 END) as admin_accounts
FROM users;

-- 2. Check for duplicate emails
SELECT 
    '=== DUPLICATE EMAIL CHECK ===' as section;

SELECT 
    email, 
    COUNT(*) as count
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 3. Check recent users (last 10)
SELECT 
    '=== RECENT USERS (LAST 10) ===' as section;

SELECT 
    id,
    email,
    display_name,
    account_type,
    user_status,
    balance,
    vip_level,
    tasks_completed,
    training_completed,
    is_frozen,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check training_accounts table
SELECT 
    '=== TRAINING ACCOUNTS TABLE ===' as section;

SELECT 
    COUNT(*) as total_training_accounts,
    COUNT(DISTINCT email) as unique_emails
FROM training_accounts;

SELECT 
    id,
    user_id,
    email,
    status,
    progress,
    completed,
    created_at
FROM training_accounts 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check for orphaned training accounts (no matching user)
SELECT 
    '=== ORPHANED TRAINING ACCOUNTS ===' as section;

SELECT 
    ta.id,
    ta.email,
    ta.user_id,
    u.id as matching_user_id,
    u.email as matching_user_email
FROM training_accounts ta
LEFT JOIN users u ON ta.user_id = u.id
WHERE u.id IS NULL;

-- 6. Check tasks table
SELECT 
    '=== TASKS TABLE ===' as section;

SELECT 
    user_id,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN status = 'locked' THEN 1 END) as locked_tasks
FROM tasks 
GROUP BY user_id;

-- 7. Check transactions table
SELECT 
    '=== TRANSACTIONS TABLE ===' as section;

SELECT 
    user_id,
    type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM transactions 
GROUP BY user_id, type
ORDER BY user_id, type;

-- 8. Check withdrawals table
SELECT 
    '=== WITHDRAWALS TABLE ===' as section;

SELECT 
    COUNT(*) as total_withdrawals,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM withdrawals;

SELECT 
    id,
    user_id,
    amount,
    status,
    created_at
FROM withdrawals 
ORDER BY created_at DESC 
LIMIT 10;

-- 9. Check for users with negative balance (excluding pending orders)
SELECT 
    '=== NEGATIVE BALANCES (EXCLUDING PENDING ORDERS) ===' as section;

SELECT 
    id,
    email,
    balance,
    has_pending_order,
    pending_amount,
    is_negative_balance
FROM users 
WHERE balance < 0 AND has_pending_order = false;

-- 10. Check users with pending orders
SELECT 
    '=== USERS WITH PENDING ORDERS ===' as section;

SELECT 
    id,
    email,
    balance,
    has_pending_order,
    trigger_task_number,
    pending_amount,
    is_negative_balance,
    profit_added
FROM users 
WHERE has_pending_order = true;

-- 11. Check for frozen users
SELECT 
    '=== FROZEN USERS ===' as section;

SELECT 
    id,
    email,
    is_frozen,
    user_status,
    account_type
FROM users 
WHERE is_frozen = true OR user_status = 'suspended';

-- 12. Check for deleted users
SELECT 
    '=== DELETED USERS ===' as section;

SELECT 
    id,
    email,
    user_status,
    account_type,
    created_at
FROM users 
WHERE user_status = 'deleted';

-- 13. Check auth.users vs public.users mapping
SELECT 
    '=== AUTH.USERS VS PUBLIC.USERS MAPPING ===' as section;

-- Note: This query requires access to auth.users schema
-- If you have access, run:
-- SELECT 
--     auth.id as auth_id,
--     auth.email as auth_email,
--     public.id as public_id,
--     public.email as public_email,
--     public.account_type
-- FROM auth.users auth
-- LEFT JOIN public.users public ON auth.id = public.id
-- ORDER BY auth.created_at DESC
-- LIMIT 10;

-- 14. Summary report
SELECT 
    '=== SUMMARY REPORT ===' as section;

SELECT 
    'Total Users' as metric,
    COUNT(*)::text as value
FROM users
UNION ALL
SELECT 
    'Personal Accounts',
    COUNT(*)::text
FROM users WHERE account_type = 'personal'
UNION ALL
SELECT 
    'Training Accounts',
    COUNT(*)::text
FROM users WHERE account_type = 'training'
UNION ALL
SELECT 
    'Admin Accounts',
    COUNT(*)::text
FROM users WHERE account_type = 'admin'
UNION ALL
SELECT 
    'Active Users',
    COUNT(*)::text
FROM users WHERE user_status = 'active'
UNION ALL
SELECT 
    'Frozen Users',
    COUNT(*)::text
FROM users WHERE is_frozen = true
UNION ALL
SELECT 
    'Deleted Users',
    COUNT(*)::text
FROM users WHERE user_status = 'deleted'
UNION ALL
SELECT 
    'Total Tasks',
    COUNT(*)::text
FROM tasks
UNION ALL
SELECT 
    'Total Transactions',
    COUNT(*)::text
FROM transactions;
