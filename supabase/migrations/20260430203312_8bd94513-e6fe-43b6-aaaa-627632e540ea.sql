
-- 1. Agent API Keys (hashed)
CREATE TABLE public.agent_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_api_keys_agent ON public.agent_api_keys(agent_id);
CREATE INDEX idx_agent_api_keys_hash ON public.agent_api_keys(key_hash) WHERE revoked_at IS NULL;

ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own api keys"
  ON public.agent_api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Error Logs
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  agent_id UUID,
  source TEXT NOT NULL, -- e.g. 'chat', 'widget', 'extract-text'
  level TEXT NOT NULL DEFAULT 'error', -- error|warn|info
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_logs_user ON public.error_logs(user_id, created_at DESC);
CREATE INDEX idx_error_logs_agent ON public.error_logs(agent_id, created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own error logs"
  ON public.error_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Edge functions (service role) bypass RLS, no insert policy needed for users
CREATE POLICY "Users delete own error logs"
  ON public.error_logs FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Agent Webhooks
CREATE TABLE public.agent_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  events TEXT[] NOT NULL DEFAULT ARRAY['chat.completed']::text[],
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  last_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_webhooks_agent ON public.agent_webhooks(agent_id);

ALTER TABLE public.agent_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own webhooks"
  ON public.agent_webhooks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_agent_webhooks_updated_at
  BEFORE UPDATE ON public.agent_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
