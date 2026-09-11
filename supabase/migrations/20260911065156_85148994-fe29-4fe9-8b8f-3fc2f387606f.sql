CREATE TABLE public.template_stats (
  template_id TEXT PRIMARY KEY,
  clone_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.template_stats TO anon;
GRANT SELECT ON public.template_stats TO authenticated;
GRANT ALL ON public.template_stats TO service_role;

ALTER TABLE public.template_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read template stats"
ON public.template_stats FOR SELECT
USING (true);

CREATE TRIGGER update_template_stats_updated_at
BEFORE UPDATE ON public.template_stats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_template_clone(_template_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _template_id IS NULL OR length(trim(_template_id)) = 0 OR length(_template_id) > 100 THEN
    RAISE EXCEPTION 'Invalid template id';
  END IF;

  INSERT INTO public.template_stats (template_id, clone_count)
  VALUES (_template_id, 1)
  ON CONFLICT (template_id)
  DO UPDATE SET clone_count = public.template_stats.clone_count + 1, updated_at = now()
  RETURNING clone_count INTO new_count;

  RETURN new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_template_clone(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_template_clone(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_template_clone(TEXT) TO service_role;