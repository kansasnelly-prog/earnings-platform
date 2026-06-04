-- Stage 2: Ironclad Database Schema Purification
-- Virtuoso-Ironclad Resilience Charter (Laws 2, 4, and 19)
-- Comprehensive reconnaissance pass reveals: project uses public.users table (NOT profiles)

-- 1. Ensure the total_tasks tracking parameter exists securely on the public.users architecture
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS total_tasks integer DEFAULT 45;

-- 2. Add to profiles table as well for complete alignment (defensive measure)
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS total_tasks integer DEFAULT 45;

-- 3. Forcefully inject the field parameters into the metadata profiles table if applicable
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_tasks integer DEFAULT 45;
    END IF;
END $$;

-- 4. Add comments for documentation
COMMENT ON COLUMN public.users.total_tasks IS 'Total number of tasks for the user account (45 for training, 35 for personal)';
COMMENT ON COLUMN public.profiles.total_tasks IS 'Total number of tasks for the user account (45 for training, 35 for personal)';

-- 5. Forcefully order the remote PostgREST API Gateway cache layer to purge its old snapshots instantly
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
