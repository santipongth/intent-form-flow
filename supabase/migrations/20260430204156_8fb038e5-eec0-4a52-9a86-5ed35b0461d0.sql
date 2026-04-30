ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_webhooks;
ALTER TABLE public.agent_webhooks REPLICA IDENTITY FULL;