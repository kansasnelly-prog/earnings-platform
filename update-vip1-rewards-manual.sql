-- MANUAL SQL SCRIPT TO UPDATE VIP1 PERSONAL TASK REWARDS
-- Run this in Supabase SQL Editor to fix existing tasks

-- Step 1: Create RPC function to update rewards
CREATE OR REPLACE FUNCTION update_vip1_personal_rewards()
RETURNS JSONB AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update existing VIP1 personal account tasks to use predefined rewards
    -- Rewards (35 tasks summing to $10.25)
    UPDATE tasks
    SET reward = CASE task_number
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
    commission_rate = 0.005
    WHERE user_id IN (
        SELECT id FROM users
        WHERE account_type = 'personal'
        AND vip_level = 1
    )
    AND task_number <= 35;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'updated_count', updated_count,
        'message', 'VIP1 personal task rewards updated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Grant execute permission
GRANT EXECUTE ON FUNCTION update_vip1_personal_rewards() TO authenticated;

-- Step 3: Run the function to update existing tasks
SELECT update_vip1_personal_rewards();

-- Step 4: Verify the update
SELECT 
    u.email,
    u.account_type,
    u.vip_level,
    COUNT(t.id) as task_count,
    SUM(t.reward) as total_reward,
    MIN(t.reward) as min_reward,
    MAX(t.reward) as max_reward
FROM users u
INNER JOIN tasks t ON t.user_id = u.id
WHERE u.account_type = 'personal'
AND u.vip_level = 1
GROUP BY u.email, u.account_type, u.vip_level;
