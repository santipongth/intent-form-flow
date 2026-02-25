
-- conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  title text DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations" ON public.conversations FOR ALL USING (auth.uid() = user_id);

-- chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  tokens_used int DEFAULT 0,
  response_time_ms int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chat messages" ON public.chat_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));

-- agent_analytics_events table
CREATE TABLE public.agent_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid,
  event_type text NOT NULL,
  tokens_used int DEFAULT 0,
  response_time_ms int DEFAULT 0,
  status text DEFAULT 'success',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.agent_analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own analytics" ON public.agent_analytics_events FOR ALL USING (auth.uid() = user_id);

-- updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
