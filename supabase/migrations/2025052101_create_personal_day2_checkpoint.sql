-- ============================================================================
-- PERSONAL ACCOUNT DAY 2 CHECKPOINT SYSTEM
-- Created: May 21, 2026
-- Purpose: Implement Day 2 checkpoint for personal accounts at task 21
-- Similar to training Phase 2 but for personal accounts
-- ============================================================================

-- Add field to track personal account Day 2 checkpoint
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_day2_checkpoint JSONB DEFAULT '{"status": "pending", "triggered_at": null, "cleared_at": null, "multiplier_applied": false}'::jsonb;

-- Add field to track personal account cycle (Day 1, Day 2, etc.)
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_cycle INTEGER DEFAULT 1;

-- Add field to track if personal account has completed Day 1
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_cycle_completed BOOLEAN DEFAULT false;

-- Add index for personal cycle tracking
CREATE INDEX IF NOT EXISTS idx_users_personal_cycle ON users(personal_cycle);
CREATE INDEX IF NOT EXISTS idx_users_personal_cycle_completed ON users(personal_cycle_completed) WHERE personal_cycle_completed = true;

-- Create function to handle Personal Account Day 2 checkpoint at task #21
CREATE OR REPLACE FUNCTION check_personal_day2_checkpoint()
RETURNS TRIGGER AS $$
DECLARE
  existing_checkpoint RECORD;
BEGIN
  -- Check if user is personal account in Day 2 (cycle 2) and has reached task #21 in Set 2
  -- Only trigger if:
  -- 1. account_type = 'personal'
  -- 2. personal_cycle = 2 (Day 2)
  -- 3. tasks_completed >= 21 (reached checkpoint task)
  -- 4. tasks_completed was < 21 before this update (first time reaching task 21)
  -- 5. No checkpoint already exists or is not pending_review
  IF NEW.account_type = 'personal' 
     AND NEW.personal_cycle = 2 
     AND NEW.tasks_completed >= 21 
     AND OLD.tasks_completed < 21
     AND (NEW.personal_day2_checkpoint->>'status' IS NULL OR NEW.personal_day2_checkpoint->>'status' = 'pending' OR NEW.personal_day2_checkpoint->>'status' = 'none') THEN
    
    -- Additional duplicate prevention: Check if checkpoint already exists in personal_day2_checkpoints table
    SELECT * INTO existing_checkpoint 
    FROM personal_day2_checkpoints 
    WHERE auth_user_id = NEW.id 
      AND cycle = 2 
      AND status IN ('pending', 'pending_review', 'approved', 'submitted', 'bonus_paid')
    LIMIT 1;
    
    IF existing_checkpoint IS NOT NULL THEN
      RAISE NOTICE 'Personal Day 2 checkpoint already exists for user %, skipping trigger', NEW.email;
      RETURN NEW;
    END IF;
    
    -- Trigger Day 2 checkpoint modal
    NEW.personal_day2_checkpoint = jsonb_build_object(
      'status', 'pending_review',
      'triggered_at', NOW(),
      'cleared_at', null,
      'multiplier_applied', false,
      'task_number', 21
    );
    
    -- Set balance to negative (combination product cost)
    -- Use -31 or -33 based on system logic
    NEW.balance = -31.00;
    NEW.is_negative_balance = true;
    
    RAISE NOTICE 'Personal Day 2 checkpoint triggered for user % at task 21', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Personal Day 2 checkpoint
DROP TRIGGER IF EXISTS trigger_check_personal_day2_checkpoint ON users;
CREATE TRIGGER trigger_check_personal_day2_checkpoint
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_personal_day2_checkpoint();

-- Create function to apply 6x profit multiplier after Personal Day 2 checkpoint is approved and submitted
CREATE OR REPLACE FUNCTION apply_personal_day2_multiplier()
RETURNS TRIGGER AS $$
DECLARE
  multiplier DECIMAL := 6.0;
  checkpoint_data JSONB;
BEGIN
  -- Check if Personal Day 2 checkpoint was just approved (status changed from pending_review to approved)
  IF NEW.personal_day2_checkpoint->>'status' = 'approved' 
     AND (OLD.personal_day2_checkpoint->>'status' = 'pending_review' OR OLD.personal_day2_checkpoint->>'status' = 'pending') THEN
    
    -- Store checkpoint data for later use
    checkpoint_data = NEW.personal_day2_checkpoint;
    
    -- Note: The actual 6x bonus will be applied when user submits the premium product
    -- This trigger just marks that the checkpoint is approved and ready for submission
    
    RAISE NOTICE 'Personal Day 2 checkpoint approved for user %, ready for submission', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Personal Day 2 multiplier
DROP TRIGGER IF EXISTS trigger_apply_personal_day2_multiplier ON users;
CREATE TRIGGER trigger_apply_personal_day2_multiplier
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION apply_personal_day2_multiplier();

-- Create personal_day2_checkpoints table (similar to phase2_checkpoints but for personal accounts)
CREATE TABLE IF NOT EXISTS personal_day2_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  cycle INTEGER DEFAULT 2, -- Day 2
  task_number INTEGER DEFAULT 21,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending', 'pending_review', 'approved', 'rejected', 'completed', 'submitted', 'bonus_paid')),
  
  -- Product information
  product1_name TEXT,
  product1_image TEXT,
  product1_price NUMERIC,
  product2_name TEXT,
  product2_image TEXT,
  product2_price NUMERIC,
  combination_value NUMERIC,
  bonus_amount NUMERIC,
  
  -- Review information
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for personal_day2_checkpoints
CREATE INDEX IF NOT EXISTS idx_personal_day2_checkpoints_user_id ON personal_day2_checkpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_day2_checkpoints_auth_user_id ON personal_day2_checkpoints(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_personal_day2_checkpoints_status ON personal_day2_checkpoints(status);
CREATE INDEX IF NOT EXISTS idx_personal_day2_checkpoints_email ON personal_day2_checkpoints(email);
CREATE INDEX IF NOT EXISTS idx_personal_day2_checkpoints_cycle ON personal_day2_checkpoints(cycle);
CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_day2_checkpoints_unique_user_cycle ON personal_day2_checkpoints(auth_user_id, cycle) WHERE status IN ('pending', 'pending_review', 'approved', 'submitted', 'bonus_paid');

-- Enable RLS on personal_day2_checkpoints
ALTER TABLE personal_day2_checkpoints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on personal_day2_checkpoints" ON personal_day2_checkpoints;

-- Policy: Users can only read their own checkpoints
CREATE POLICY "Users can read own personal_day2_checkpoints" ON personal_day2_checkpoints
    FOR SELECT TO authenticated
    USING (auth.uid() = auth_user_id);

-- Policy: Users can insert their own checkpoints
CREATE POLICY "Users can insert own personal_day2_checkpoints" ON personal_day2_checkpoints
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = auth_user_id);

-- Policy: Admins can read all checkpoints (assuming admin role or specific condition)
CREATE POLICY "Admins can read all personal_day2_checkpoints" ON personal_day2_checkpoints
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND account_type = 'admin'
      )
    );

-- Policy: Admins can update all checkpoints
CREATE POLICY "Admins can update all personal_day2_checkpoints" ON personal_day2_checkpoints
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND account_type = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND account_type = 'admin'
      )
    );

-- Add comment to document the table
COMMENT ON TABLE personal_day2_checkpoints IS 'Stores Day 2 checkpoint data for personal accounts (triggered at task 21)';
