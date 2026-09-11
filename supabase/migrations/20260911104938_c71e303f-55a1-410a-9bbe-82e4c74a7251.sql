-- ============ custom tools ============
CREATE TABLE public.agent_custom_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL DEFAULT 'GET',
  url TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  auth_type TEXT NOT NULL DEFAULT 'none',
  auth_header_name TEXT,
  auth_secret TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_custom_tools_method_chk CHECK (method IN ('GET','POST','PUT','PATCH','DELETE')),
  CONSTRAINT agent_custom_tools_auth_chk CHECK (auth_type IN ('none','header','bearer')),
  CONSTRAINT agent_custom_tools_name_chk CHECK (name ~ '^[a-zA-Z][a-zA-Z0-9_]{0,40}$'),
  CONSTRAINT agent_custom_tools_url_chk CHECK (url ~* '^https://')
);
CREATE UNIQUE INDEX agent_custom_tools_agent_name_idx ON public.agent_custom_tools(agent_id, lower(name));
CREATE INDEX agent_custom_tools_agent_idx ON public.agent_custom_tools(agent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_custom_tools TO authenticated;
GRANT ALL ON public.agent_custom_tools TO service_role;
ALTER TABLE public.agent_custom_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own custom tools" ON public.agent_custom_tools
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_agent_custom_tools_updated_at BEFORE UPDATE ON public.agent_custom_tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ guardrails ============
CREATE TABLE public.agent_guardrails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL UNIQUE REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  blocked_keywords TEXT[] NOT NULL DEFAULT '{}',
  pii_redaction BOOLEAN NOT NULL DEFAULT true,
  injection_detection BOOLEAN NOT NULL DEFAULT true,
  ai_review BOOLEAN NOT NULL DEFAULT false,
  blocked_message TEXT NOT NULL DEFAULT 'ขออภัย ไม่สามารถตอบคำถามนี้ได้',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_guardrails TO authenticated;
GRANT ALL ON public.agent_guardrails TO service_role;
ALTER TABLE public.agent_guardrails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own guardrails" ON public.agent_guardrails
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_agent_guardrails_updated_at BEFORE UPDATE ON public.agent_guardrails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ budgets ============
CREATE TABLE public.agent_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL UNIQUE REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  daily_token_limit INTEGER,
  monthly_token_limit INTEGER,
  daily_message_limit INTEGER,
  monthly_message_limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_budgets_positive_chk CHECK (
    coalesce(daily_token_limit, 1) > 0 AND coalesce(monthly_token_limit, 1) > 0
    AND coalesce(daily_message_limit, 1) > 0 AND coalesce(monthly_message_limit, 1) > 0
  )
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_budgets TO authenticated;
GRANT ALL ON public.agent_budgets TO service_role;
ALTER TABLE public.agent_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own budgets" ON public.agent_budgets
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_agent_budgets_updated_at BEFORE UPDATE ON public.agent_budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ usage counters ============
CREATE TABLE public.agent_usage_counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  tokens BIGINT NOT NULL DEFAULT 0,
  messages INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_usage_period_chk CHECK (period_type IN ('day','month'))
);
CREATE UNIQUE INDEX agent_usage_counters_key_idx
  ON public.agent_usage_counters(agent_id, period_type, period_start);

GRANT SELECT, DELETE ON public.agent_usage_counters TO authenticated;
GRANT ALL ON public.agent_usage_counters TO service_role;
ALTER TABLE public.agent_usage_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own usage counters" ON public.agent_usage_counters
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users reset own usage counters" ON public.agent_usage_counters
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_agent_usage_counters_updated_at BEFORE UPDATE ON public.agent_usage_counters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_agent_usage(
  _agent_id UUID, _user_id UUID, _tokens INTEGER, _messages INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  bkk_date DATE := (now() AT TIME ZONE 'Asia/Bangkok')::date;
BEGIN
  INSERT INTO public.agent_usage_counters (agent_id, user_id, period_type, period_start, tokens, messages)
  VALUES (_agent_id, _user_id, 'day', bkk_date, GREATEST(coalesce(_tokens,0),0), GREATEST(coalesce(_messages,0),0))
  ON CONFLICT (agent_id, period_type, period_start)
  DO UPDATE SET tokens = public.agent_usage_counters.tokens + GREATEST(coalesce(_tokens,0),0),
                messages = public.agent_usage_counters.messages + GREATEST(coalesce(_messages,0),0),
                updated_at = now();

  INSERT INTO public.agent_usage_counters (agent_id, user_id, period_type, period_start, tokens, messages)
  VALUES (_agent_id, _user_id, 'month', date_trunc('month', bkk_date)::date, GREATEST(coalesce(_tokens,0),0), GREATEST(coalesce(_messages,0),0))
  ON CONFLICT (agent_id, period_type, period_start)
  DO UPDATE SET tokens = public.agent_usage_counters.tokens + GREATEST(coalesce(_tokens,0),0),
                messages = public.agent_usage_counters.messages + GREATEST(coalesce(_messages,0),0),
                updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.increment_agent_usage(UUID, UUID, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_agent_usage(UUID, UUID, INTEGER, INTEGER) TO service_role;

-- ============ citations: return chunk position + file id ============
DROP FUNCTION IF EXISTS public.match_knowledge_chunks(uuid, extensions.vector, integer);
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  _agent_id uuid, _query_embedding extensions.vector, _match_count integer DEFAULT 8
) RETURNS TABLE(id uuid, file_id uuid, file_name text, chunk_index integer, content text, similarity double precision)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT kc.id,
         kc.file_id,
         kc.file_name,
         kc.chunk_index,
         kc.content,
         1 - (kc.embedding OPERATOR(extensions.<=>) _query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.agent_id = _agent_id
    AND kc.embedding IS NOT NULL
  ORDER BY kc.embedding OPERATOR(extensions.<=>) _query_embedding
  LIMIT LEAST(GREATEST(COALESCE(_match_count, 8), 1), 30);
$$;
REVOKE ALL ON FUNCTION public.match_knowledge_chunks(uuid, extensions.vector, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks(uuid, extensions.vector, integer) TO authenticated, service_role;