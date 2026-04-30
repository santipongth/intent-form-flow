
-- 1. Restrict get_platform_stats to service_role only
REVOKE EXECUTE ON FUNCTION public.get_platform_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_platform_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_platform_stats() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO service_role;

-- 2. agent_analytics_events: ensure user_id is owner-scoped
DELETE FROM public.agent_analytics_events WHERE user_id IS NULL;
ALTER TABLE public.agent_analytics_events ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.agent_analytics_events ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3. Add UPDATE policy for knowledge-files storage bucket
CREATE POLICY "Users update own knowledge files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'knowledge-files' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'knowledge-files' AND (storage.foldername(name))[1] = auth.uid()::text);
