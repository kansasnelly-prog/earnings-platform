-- Module 1: Mandatory In-Database Cache Purge
-- Isaiah 54:17 Boundary Lockdown: No weapon formed against this system shall prosper
-- This migration forces the PostgREST server to rebuild its entire schema cache map

-- Refresh the Postgres internal notification queue layers
SELECT pg_notification_queue_usage();

-- Forcefully signal PostgREST to tear down and rebuild its entire schema cache map
NOTIFY pgrst, 'reload schema';

-- Additional cache purge commands for complete schema refresh
-- This ensures all cached column definitions are invalidated and rebuilt
NOTIFY pgrst, 'reload config';
