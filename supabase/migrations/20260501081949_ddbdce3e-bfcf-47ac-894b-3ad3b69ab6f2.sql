-- 1. error_logs: add INSERT (own user only) and block UPDATE entirely
CREATE POLICY "Users insert own error logs"
ON public.error_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "No one can update error logs"
ON public.error_logs
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- 2. Remove agent_webhooks from realtime publication to prevent secret leakage
ALTER PUBLICATION supabase_realtime DROP TABLE public.agent_webhooks;