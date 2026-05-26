-- Restore Fire@gmail.com to Day 2 state
-- Target: balance = 71.63, total_earned = 20.50, personal_cycle = 2

-- Update users table
UPDATE users 
SET 
  balance = 71.63,
  total_earned = 20.50,
  personal_cycle = 2,
  personal_cycle_completed = false,
  tasks_completed = 0,
  training_progress = 0,
  current_task_set = 0,
  updated_at = NOW()
WHERE email = 'Fire@gmail.com';

-- Verify the update
SELECT 
  email,
  balance,
  total_earned,
  personal_cycle,
  personal_cycle_completed,
  tasks_completed,
  training_progress,
  current_task_set,
  updated_at
FROM users
WHERE email = 'Fire@gmail.com';
