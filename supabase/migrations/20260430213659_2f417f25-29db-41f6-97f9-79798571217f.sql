ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS memory_summary TEXT,
ADD COLUMN IF NOT EXISTS summary_message_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created 
ON public.chat_messages(conversation_id, created_at);