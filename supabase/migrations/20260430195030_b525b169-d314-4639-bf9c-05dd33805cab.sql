-- 1. Drop unused user_api_keys table (plaintext risk; feature being removed)
DROP TABLE IF EXISTS public.user_api_keys CASCADE;

-- 2. Remove chat_messages from realtime publication (no client subscribes; prevents leak)
ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;

-- 3. Add WITH CHECK to agent_ab_tests policy to enforce ownership on writes
DROP POLICY IF EXISTS "Users manage own ab tests" ON public.agent_ab_tests;
CREATE POLICY "Users manage own ab tests"
ON public.agent_ab_tests
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Revoke EXECUTE on SECURITY DEFINER trigger helpers from public roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;