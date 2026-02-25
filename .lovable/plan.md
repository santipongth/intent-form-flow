

# Real AI Chat System - Complete Setup

## Problem
The chat system code exists (ChatConsole, streamChat, useConversations, edge function) but won't work because:
1. **Database tables missing** - `conversations`, `chat_messages`, `agent_analytics_events` tables don't exist yet
2. **Edge function not configured** - `supabase/config.toml` doesn't have `[functions.chat]` with `verify_jwt = false`
3. These two gaps mean the streaming chat will fail on both the API call and the data persistence side

## Plan

### Step 1: Create Database Tables
Run a migration to create the 3 core tables needed for chat:

- **conversations** (id, user_id, agent_id, title, created_at, updated_at) with RLS by user_id
- **chat_messages** (id, conversation_id, role, content, tokens_used, response_time_ms, created_at) with RLS via conversation ownership
- **agent_analytics_events** (id, agent_id, user_id, event_type, tokens_used, response_time_ms, status, metadata, created_at) with RLS by user_id

Enable Realtime on `chat_messages`.

### Step 2: Configure Edge Function
Update `supabase/config.toml` to add:
```toml
[functions.chat]
verify_jwt = false
```

### Step 3: Deploy Edge Function
Deploy the existing `supabase/functions/chat/index.ts` so it's live and callable.

### Step 4: Test
Use the curl tool to send a test message to the chat edge function and verify streaming works.

## Technical Details

### Database Migration SQL
```sql
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
```

### Files Changed
| File | Change |
|------|--------|
| `supabase/config.toml` | Add `[functions.chat]` config |
| Database migration | Create 3 tables + RLS + trigger |

No code file changes needed - the existing ChatConsole.tsx, streamChat.ts, useConversations.ts, and chat edge function are already correctly implemented.
