CREATE TABLE public.agent_mcp_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  transport text NOT NULL DEFAULT 'http',
  auth_type text NOT NULL DEFAULT 'none',
  auth_header_name text,
  auth_secret text,
  enabled boolean NOT NULL DEFAULT true,
  allowed_tools text[] NOT NULL DEFAULT '{}',
  cached_tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_synced_at timestamptz,
  last_status text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_mcp_servers_transport_chk CHECK (transport IN ('http')),
  CONSTRAINT agent_mcp_servers_auth_chk CHECK (auth_type IN ('none','bearer','header'))
);

GRANT SELECT (id, agent_id, user_id, name, url, transport, auth_type, auth_header_name, enabled, allowed_tools, cached_tools, last_synced_at, last_status, last_error, created_at, updated_at) ON public.agent_mcp_servers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.agent_mcp_servers TO authenticated;
GRANT ALL ON public.agent_mcp_servers TO service_role;

ALTER TABLE public.agent_mcp_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own MCP servers"
ON public.agent_mcp_servers FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_agent_mcp_servers_updated_at
BEFORE UPDATE ON public.agent_mcp_servers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_agent_mcp_servers_agent ON public.agent_mcp_servers(agent_id);

ALTER TABLE public.agent_custom_tools ADD COLUMN IF NOT EXISTS headers jsonb NOT NULL DEFAULT '{}'::jsonb;