-- Add personal_cycle field to track VIP1 personal account cycles
-- Cycle 1: First 35/35 tasks (withdrawal locked, wallet binding locked)
-- Cycle 2: Second 35/35 tasks (unlocks withdrawal and wallet binding)

-- Add personal_cycle column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS personal_cycle INTEGER DEFAULT 1 CHECK (personal_cycle IN (1, 2));

-- Add personal_cycle_completed column to track if current cycle is completed
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS personal_cycle_completed BOOLEAN DEFAULT false;

-- Add comment to document the fields
COMMENT ON COLUMN users.personal_cycle IS 'VIP1 personal account cycle: 1 = first 35 tasks, 2 = second 35 tasks';
COMMENT ON COLUMN users.personal_cycle_completed IS 'True when current 35-task cycle is completed, requires admin reset to advance';
