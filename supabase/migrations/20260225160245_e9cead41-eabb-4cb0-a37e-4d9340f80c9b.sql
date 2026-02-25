
-- Create knowledge_files table
CREATE TABLE public.knowledge_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT 'text/plain',
  content TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own knowledge files"
  ON public.knowledge_files
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-files', 'knowledge-files', false);

-- Storage RLS policies
CREATE POLICY "Users upload own knowledge files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'knowledge-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own knowledge files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'knowledge-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own knowledge files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'knowledge-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
