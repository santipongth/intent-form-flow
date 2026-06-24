
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS external_session_id text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_external_session
  ON public.conversations (user_id, agent_id, external_session_id)
  WHERE external_session_id IS NOT NULL;
