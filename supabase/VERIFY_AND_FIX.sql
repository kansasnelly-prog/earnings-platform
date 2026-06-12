-- ============================================================================
-- VERIFY DATA AND FIX IF NEEDED
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Check if users table exists and has data
SELECT 'USERS TABLE:' as section;
SELECT COUNT(*) as total_users FROM users;

-- 2. Show all users (if any exist)
SELECT 'ALL USERS:' as section;
SELECT * FROM users LIMIT 10;

-- 3. Check if training_accounts exists
SELECT 'TRAINING ACCOUNTS TABLE:' as section;
SELECT COUNT(*) as total_training_accounts FROM training_accounts;

-- 4. Show all training accounts
SELECT 'ALL TRAINING ACCOUNTS:' as section;
SELECT * FROM training_accounts LIMIT 10;

-- 5. If NO users exist, insert test data
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM users) = 0 THEN
        -- Insert sample users
        INSERT INTO users (id, email, display_name, password_hash, balance, account_type, vip_level, tasks_completed, referral_code, created_at)
        VALUES 
            (gen_random_uuid(), 'kansasnelly@gmail.com', 'Admin User', 'hashed_pass', 1000, 'admin', 5, 0, 'ADMIN001', NOW()),
            (gen_random_uuid(), 'user1@test.com', 'John Doe', 'hashed_pass', 500, 'personal', 1, 15, 'USER001', NOW()),
            (gen_random_uuid(), 'user2@test.com', 'Jane Smith', 'hashed_pass', 750, 'personal', 2, 25, 'USER002', NOW()),
            (gen_random_uuid(), 'training1@test.com', 'Training Account 1', 'hashed_pass', 1100, 'training', 1, 5, 'TRAIN001', NOW()),
            (gen_random_uuid(), 'training2@test.com', 'Training Account 2', 'hashed_pass', 1100, 'training', 1, 3, 'TRAIN002', NOW());
        
        RAISE NOTICE 'Inserted 5 test users';
    ELSE
        RAISE NOTICE 'Users already exist, skipping insert';
    END IF;
END $$;

-- 6. If NO training_accounts exist, create them
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM training_accounts) = 0 THEN
        INSERT INTO training_accounts (id, email, password, status, progress, total_tasks, created_at)
        VALUES 
            (gen_random_uuid(), 'training1@test.com', 'password123', 'active', 5, 45, NOW()),
            (gen_random_uuid(), 'training2@test.com', 'password123', 'active', 3, 45, NOW());
        
        RAISE NOTICE 'Inserted 2 test training accounts';
    ELSE
        RAISE NOTICE 'Training accounts already exist, skipping insert';
    END IF;
END $$;

-- 7. Verify RLS policies are permissive
SELECT 'RLS POLICIES:' as section;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'training_accounts', 'withdrawals', 'tasks')
ORDER BY tablename;

-- 8. Final count after insert
SELECT 'FINAL COUNTS:' as section;
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Training Accounts', COUNT(*) FROM training_accounts
UNION ALL
SELECT 'Withdrawals', COUNT(*) FROM withdrawals
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks;
