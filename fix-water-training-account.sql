-- FIX WATER@GMAIL.COM TRAINING ACCOUNT STATE
-- Run this in Supabase SQL Editor to fix the training account

-- Step 1: Check current state of water@gmail.com training account
SELECT 
    u.id,
    u.email,
    u.account_type,
    u.balance,
    u.total_earned,
    u.training_completed,
    u.training_completed_v2,
    u.task_number,
    u.tasks_completed,
    ta.task_number as training_task_number,
    ta.amount as training_amount,
    ta.completed as training_completed
FROM users u
LEFT JOIN training_accounts ta ON ta.auth_user_id = u.id
WHERE u.email = 'water@gmail.com';

-- Step 2: Fix users table for water@gmail.com
UPDATE users
SET 
    balance = 2505.48,  -- Balance after 2% transfer (2556.61 - 51.13)
    total_earned = 1456.61,  -- Total earned (should not change)
    training_completed = true,  -- Mark training as completed
    training_completed_v2 = true,  -- Mark training as completed (v2)
    task_number = 46,  -- 45 tasks completed + 1 = next task would be 46
    tasks_completed = 45,  -- 45 tasks completed
    updated_at = NOW()
WHERE email = 'water@gmail.com'
AND account_type = 'training';

-- Step 3: Fix training_accounts table for water@gmail.com
UPDATE training_accounts
SET 
    amount = 1456.61,  -- Total earned (should not change)
    task_number = 46,  -- 45 tasks completed + 1 = next task would be 46
    completed = true  -- Mark training as completed
WHERE auth_user_id IN (
    SELECT id FROM users 
    WHERE email = 'water@gmail.com'
    AND account_type = 'training'
);

-- Step 4: Verify the fix
SELECT 
    u.email,
    u.account_type,
    u.balance,
    u.total_earned,
    u.training_completed,
    u.training_completed_v2,
    u.task_number,
    u.tasks_completed,
    ta.task_number as training_task_number,
    ta.amount as training_amount,
    ta.completed as training_completed
FROM users u
LEFT JOIN training_accounts ta ON ta.auth_user_id = u.id
WHERE u.email = 'water@gmail.com';

-- Expected results:
-- balance: 2505.48
-- total_earned: 1456.61
-- training_completed: true
-- training_completed_v2: true
-- task_number: 46
-- tasks_completed: 45
-- training_task_number: 46
-- training_amount: 1456.61
-- training_completed: true
