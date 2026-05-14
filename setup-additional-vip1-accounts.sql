-- SETUP VIP1 PERSONAL ACCOUNTS FOR umarjan2244@gmail.com AND izaz83910@mail.com
-- Run this in Supabase SQL Editor after the main update-vip1-rewards-manual.sql

-- Step 1: Check current state of these accounts
SELECT 
    id,
    email,
    account_type,
    vip_level,
    balance,
    total_earned,
    tasks_completed,
    wallet_bound,
    withdrawal_unlocked
FROM users
WHERE email IN ('umarjan2244@gmail.com', 'izaz83910@mail.com');

-- Step 2: Reset tasks_completed for these accounts
UPDATE users
SET 
    tasks_completed = 0,
    updated_at = NOW()
WHERE email IN ('umarjan2244@gmail.com', 'izaz83910@mail.com')
AND account_type = 'personal'
AND vip_level = 1;

-- Step 3: Delete existing tasks for these accounts
DELETE FROM tasks
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN ('umarjan2244@gmail.com', 'izaz83910@mail.com')
    AND account_type = 'personal'
    AND vip_level = 1
);

-- Step 4: Create 35 new tasks with predefined rewards
-- For umarjan2244@gmail.com
INSERT INTO tasks (user_id, task_number, reward, commission_rate, status, product_name, product_price, product_image)
SELECT 
    (SELECT id FROM users WHERE email = 'umarjan2244@gmail.com' AND account_type = 'personal' AND vip_level = 1),
    task_number,
    CASE task_number
        WHEN 1 THEN 0.12
        WHEN 2 THEN 0.13
        WHEN 3 THEN 0.14
        WHEN 4 THEN 0.15
        WHEN 5 THEN 0.16
        WHEN 6 THEN 0.17
        WHEN 7 THEN 0.18
        WHEN 8 THEN 0.19
        WHEN 9 THEN 0.20
        WHEN 10 THEN 0.21
        WHEN 11 THEN 0.22
        WHEN 12 THEN 0.23
        WHEN 13 THEN 0.24
        WHEN 14 THEN 0.25
        WHEN 15 THEN 0.26
        WHEN 16 THEN 0.27
        WHEN 17 THEN 0.28
        WHEN 18 THEN 0.29
        WHEN 19 THEN 0.30
        WHEN 20 THEN 0.31
        WHEN 21 THEN 0.32
        WHEN 22 THEN 0.33
        WHEN 23 THEN 0.34
        WHEN 24 THEN 0.35
        WHEN 25 THEN 0.36
        WHEN 26 THEN 0.37
        WHEN 27 THEN 0.38
        WHEN 28 THEN 0.39
        WHEN 29 THEN 0.40
        WHEN 30 THEN 0.41
        WHEN 31 THEN 0.42
        WHEN 32 THEN 0.43
        WHEN 33 THEN 0.44
        WHEN 34 THEN 0.45
        WHEN 35 THEN 0.56
    END,
    0.005,
    CASE WHEN task_number = 1 THEN 'pending' ELSE 'locked' END,
    'Personal Product ' || task_number,
    100,
    NULL
FROM generate_series(1, 35) AS task_number
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'umarjan2244@gmail.com' AND account_type = 'personal' AND vip_level = 1);

-- For izaz83910@mail.com
INSERT INTO tasks (user_id, task_number, reward, commission_rate, status, product_name, product_price, product_image)
SELECT 
    (SELECT id FROM users WHERE email = 'izaz83910@mail.com' AND account_type = 'personal' AND vip_level = 1),
    task_number,
    CASE task_number
        WHEN 1 THEN 0.12
        WHEN 2 THEN 0.13
        WHEN 3 THEN 0.14
        WHEN 4 THEN 0.15
        WHEN 5 THEN 0.16
        WHEN 6 THEN 0.17
        WHEN 7 THEN 0.18
        WHEN 8 THEN 0.19
        WHEN 9 THEN 0.20
        WHEN 10 THEN 0.21
        WHEN 11 THEN 0.22
        WHEN 12 THEN 0.23
        WHEN 13 THEN 0.24
        WHEN 14 THEN 0.25
        WHEN 15 THEN 0.26
        WHEN 16 THEN 0.27
        WHEN 17 THEN 0.28
        WHEN 18 THEN 0.29
        WHEN 19 THEN 0.30
        WHEN 20 THEN 0.31
        WHEN 21 THEN 0.32
        WHEN 22 THEN 0.33
        WHEN 23 THEN 0.34
        WHEN 24 THEN 0.35
        WHEN 25 THEN 0.36
        WHEN 26 THEN 0.37
        WHEN 27 THEN 0.38
        WHEN 28 THEN 0.39
        WHEN 29 THEN 0.40
        WHEN 30 THEN 0.41
        WHEN 31 THEN 0.42
        WHEN 32 THEN 0.43
        WHEN 33 THEN 0.44
        WHEN 34 THEN 0.45
        WHEN 35 THEN 0.56
    END,
    0.005,
    CASE WHEN task_number = 1 THEN 'pending' ELSE 'locked' END,
    'Personal Product ' || task_number,
    100,
    NULL
FROM generate_series(1, 35) AS task_number
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'izaz83910@mail.com' AND account_type = 'personal' AND vip_level = 1);

-- Step 5: Ensure wallet binding and withdrawal are locked
UPDATE users
SET 
    wallet_bound = false,
    withdrawal_unlocked = false
WHERE email IN ('umarjan2244@gmail.com', 'izaz83910@mail.com')
AND account_type = 'personal'
AND vip_level = 1;

-- Step 6: Verify the setup
SELECT 
    u.email,
    u.account_type,
    u.vip_level,
    u.balance,
    u.tasks_completed,
    u.wallet_bound,
    u.withdrawal_unlocked,
    COUNT(t.id) as task_count,
    SUM(t.reward) as total_reward,
    MIN(t.reward) as min_reward,
    MAX(t.reward) as max_reward
FROM users u
LEFT JOIN tasks t ON t.user_id = u.id
WHERE u.email IN ('umarjan2244@gmail.com', 'izaz83910@mail.com')
AND u.account_type = 'personal'
AND u.vip_level = 1
GROUP BY u.email, u.account_type, u.vip_level, u.balance, u.tasks_completed, u.wallet_bound, u.withdrawal_unlocked;
