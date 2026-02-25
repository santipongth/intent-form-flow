
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_agents', (SELECT count(*) FROM public.agents),
    'total_messages', (SELECT count(*) FROM public.chat_messages),
    'total_conversations', (SELECT count(*) FROM public.conversations)
  ) INTO result;
  RETURN result;
END;
$$;
