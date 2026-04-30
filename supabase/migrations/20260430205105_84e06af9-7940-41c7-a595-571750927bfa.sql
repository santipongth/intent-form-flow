-- Per-API-key sliding window usage counter (1-minute buckets)
CREATE TABLE IF NOT EXISTS public.api_key_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL,
  user_id UUID NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (api_key_id, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_lookup
  ON public.api_key_usage (api_key_id, window_start DESC);

ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;

-- Owners can read their own usage; only service role writes (no INSERT/UPDATE policy)
CREATE POLICY "Users view own api key usage"
ON public.api_key_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Atomic increment helper to avoid races
CREATE OR REPLACE FUNCTION public.increment_api_key_usage(
  _api_key_id UUID,
  _user_id UUID,
  _window TIMESTAMP WITH TIME ZONE
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.api_key_usage (api_key_id, user_id, window_start, count)
  VALUES (_api_key_id, _user_id, _window, 1)
  ON CONFLICT (api_key_id, window_start)
  DO UPDATE SET count = public.api_key_usage.count + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;
