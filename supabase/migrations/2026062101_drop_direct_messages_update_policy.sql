-- Migration to drop existing duplicate policy on direct_messages

DROP POLICY IF EXISTS "Users can update own messages" ON public.direct_messages;

-- No other changes