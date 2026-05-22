-- Check current state of umarjan2244@gmail.com
SELECT 
  id,
  email,
  account_type,
  vip_level,
  tasks_completed,
  total_tasks,
  current_task_set,
  personal_cycle,
  personal_cycle_completed,
  set_1_completed_at,
  set_2_completed_at,
  personal_day2_checkpoint,
  balance,
  total_earned,
  training_completed
FROM users 
WHERE email = 'umarjan2244@gmail.com';
