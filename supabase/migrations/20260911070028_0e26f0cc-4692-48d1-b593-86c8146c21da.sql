CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.knowledge_files(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  chunk_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  embedding extensions.vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_chunks TO authenticated;
GRANT ALL ON public.knowledge_chunks TO service_role;

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own knowledge chunks"
  ON public.knowledge_chunks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX knowledge_chunks_agent_idx ON public.knowledge_chunks (agent_id);
CREATE INDEX knowledge_chunks_file_idx ON public.knowledge_chunks (file_id);

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  _agent_id uuid,
  _query_embedding extensions.vector(1536),
  _match_count integer DEFAULT 8
)
RETURNS TABLE(id uuid, file_name text, content text, similarity double precision)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT kc.id,
         kc.file_name,
         kc.content,
         1 - (kc.embedding OPERATOR(extensions.<=>) _query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.agent_id = _agent_id
    AND kc.embedding IS NOT NULL
  ORDER BY kc.embedding OPERATOR(extensions.<=>) _query_embedding
  LIMIT LEAST(GREATEST(COALESCE(_match_count, 8), 1), 30);
$$;

REVOKE ALL ON FUNCTION public.match_knowledge_chunks(uuid, extensions.vector, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks(uuid, extensions.vector, integer) TO service_role;

CREATE TABLE public.agent_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  conversation_id uuid,
  run_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'chat',
  step_index integer NOT NULL DEFAULT 0,
  span_type text NOT NULL,
  name text NOT NULL,
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'success',
  duration_ms integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON public.agent_traces TO authenticated;
GRANT ALL ON public.agent_traces TO service_role;

ALTER TABLE public.agent_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own traces"
  ON public.agent_traces FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own traces"
  ON public.agent_traces FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX agent_traces_run_idx ON public.agent_traces (run_id, step_index);
CREATE INDEX agent_traces_agent_created_idx ON public.agent_traces (agent_id, created_at DESC);