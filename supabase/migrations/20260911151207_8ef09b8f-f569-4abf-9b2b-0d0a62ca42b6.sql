ALTER TABLE public.knowledge_files
  ADD COLUMN source_type text NOT NULL DEFAULT 'file' CHECK (source_type IN ('file', 'url')),
  ADD COLUMN source_url text,
  ADD COLUMN source_title text,
  ADD COLUMN error_message text,
  ADD COLUMN last_crawled_at timestamptz,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX knowledge_files_agent_source_url_unique
  ON public.knowledge_files (agent_id, source_url)
  WHERE source_type = 'url' AND source_url IS NOT NULL;

CREATE TRIGGER update_knowledge_files_updated_at
  BEFORE UPDATE ON public.knowledge_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.knowledge_files (
  agent_id, user_id, file_name, file_path, file_size, file_type,
  status, source_type, source_url, error_message
)
SELECT
  a.id,
  a.user_id,
  left(regexp_replace(u.url, '^https?://', '', 'i'), 255),
  'url:' || md5(u.url),
  0,
  'text/html',
  'processing',
  'url',
  u.url,
  NULL
FROM public.agents a
CROSS JOIN LATERAL unnest(COALESCE(a.knowledge_urls, ARRAY[]::text[])) AS u(url)
WHERE u.url ~* '^https?://'
ON CONFLICT (agent_id, source_url) WHERE source_type = 'url' AND source_url IS NOT NULL DO NOTHING;