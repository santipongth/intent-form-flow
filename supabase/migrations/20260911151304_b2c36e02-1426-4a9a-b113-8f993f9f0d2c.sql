DROP FUNCTION IF EXISTS public.match_knowledge_chunks(uuid, extensions.vector, integer);

CREATE FUNCTION public.match_knowledge_chunks(
  _agent_id uuid,
  _query_embedding extensions.vector,
  _match_count integer DEFAULT 8
)
RETURNS TABLE(
  id uuid,
  file_id uuid,
  file_name text,
  chunk_index integer,
  content text,
  similarity double precision,
  source_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT kc.id,
         kc.file_id,
         kc.file_name,
         kc.chunk_index,
         kc.content,
         1 - (kc.embedding OPERATOR(extensions.<=>) _query_embedding) AS similarity,
         kf.source_url
  FROM public.knowledge_chunks kc
  LEFT JOIN public.knowledge_files kf ON kf.id = kc.file_id
  WHERE kc.agent_id = _agent_id
    AND kc.embedding IS NOT NULL
  ORDER BY kc.embedding OPERATOR(extensions.<=>) _query_embedding
  LIMIT LEAST(GREATEST(COALESCE(_match_count, 8), 1), 30);
$function$;

REVOKE ALL ON FUNCTION public.match_knowledge_chunks(uuid, extensions.vector, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks(uuid, extensions.vector, integer) TO service_role;