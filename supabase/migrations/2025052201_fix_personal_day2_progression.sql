-- ============================================================================
-- FIX PERSONAL DAY 2 PROGRESSION - SYSTEM-WIDE
-- Created: May 22, 2026
-- Purpose: Fix auto_reset_to_set_2() to properly transition users to Day 2
-- This ensures ALL personal accounts (old and new) follow the same progression
-- ============================================================================

-- Drop the old auto_reset_to_set_2 function
DROP FUNCTION IF EXISTS auto_reset_to_set_2(UUID);

-- Create the corrected function that properly sets personal_cycle = 2
CREATE OR REPLACE FUNCTION auto_reset_to_set_2(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_current_set INTEGER;
    v_tasks_completed INTEGER;
    v_current_phase INTEGER;
    v_personal_cycle INTEGER;
    v_result JSONB;
BEGIN
    -- Get current user state
    SELECT current_task_set, tasks_completed, training_phase, personal_cycle
    INTO v_current_set, v_tasks_completed, v_current_phase, v_personal_cycle
    FROM public.users 
    WHERE id = p_user_id;
    
    -- Only proceed if user is on Set 1 and has completed 35 tasks
    IF v_current_set = 1 AND v_tasks_completed >= 35 THEN
        -- Update user to Set 2 AND Day 2 (personal_cycle = 2)
        UPDATE public.users 
        SET 
            current_task_set = 2,
            personal_cycle = 2,  -- CRITICAL: Set to Day 2
            tasks_completed = 0,
            training_progress = 0,
            personal_cycle_completed = false,  -- CRITICAL: Reset stale flag
            set_1_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = p_user_id;
        
        -- Delete all existing tasks for this user
        DELETE FROM public.tasks 
        WHERE user_id = p_user_id;
        
        v_result := jsonb_build_object(
            'success', true,
            'message', 'Successfully reset from Set 1 to Set 2 and Day 2',
            'previous_set', 1,
            'new_set', 2,
            'previous_cycle', v_personal_cycle,
            'new_cycle', 2,
            'set_1_completed_at', NOW()
        );
    ELSE
        v_result := jsonb_build_object(
            'success', false,
            'message', 'Conditions not met for Set 1 to Set 2 transition',
            'current_set', v_current_set,
            'tasks_completed', v_tasks_completed,
            'personal_cycle', v_personal_cycle
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- REPAIR FUNCTION FOR LEGACY USERS ALREADY IN BROKEN STATE
-- For users who are already in Set 2 but personal_cycle = 1
-- ============================================================================

CREATE OR REPLACE FUNCTION repair_personal_day2_state(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_current_set INTEGER;
    v_personal_cycle INTEGER;
    v_tasks_completed INTEGER;
    v_task_count INTEGER;
    v_result JSONB;
BEGIN
    -- Get current user state
    SELECT current_task_set, personal_cycle, tasks_completed
    INTO v_current_set, v_personal_cycle, v_tasks_completed
    FROM public.users 
    WHERE id = p_user_id;
    
    -- Count existing tasks
    SELECT COUNT(*) INTO v_task_count
    FROM public.tasks
    WHERE user_id = p_user_id;
    
    -- Repair condition: User is in Set 2 but personal_cycle = 1 (broken state)
    IF v_current_set = 2 AND v_personal_cycle = 1 THEN
        -- Fix the cycle state
        UPDATE public.users 
        SET 
            personal_cycle = 2,
            personal_cycle_completed = false,
            updated_at = NOW()
        WHERE id = p_user_id;
        
        -- If no tasks exist, create them
        IF v_task_count = 0 THEN
            -- Tasks will be created by the application layer
            v_result := jsonb_build_object(
                'success', true,
                'message', 'Repaired personal_cycle to 2, tasks need to be generated',
                'previous_cycle', 1,
                'new_cycle', 2,
                'task_count', v_task_count,
                'action_required', 'create_tasks'
            );
        ELSE
            v_result := jsonb_build_object(
                'success', true,
                'message', 'Repaired personal_cycle to 2, tasks already exist',
                'previous_cycle', 1,
                'new_cycle', 2,
                'task_count', v_task_count
            );
        END IF;
    ELSE
        v_result := jsonb_build_object(
            'success', false,
            'message', 'No repair needed - user not in broken state',
            'current_set', v_current_set,
            'personal_cycle', v_personal_cycle,
            'task_count', v_task_count
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Personal Day 2 progression fix migration completed successfully!';
    RAISE NOTICE '🔧 Updated function: auto_reset_to_set_2 (now sets personal_cycle = 2)';
    RAISE NOTICE '🔧 Created function: repair_personal_day2_state (for legacy users)';
    RAISE NOTICE '📊 All personal accounts will now properly transition to Day 2';
END $$;
