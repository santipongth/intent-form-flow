CREATE POLICY "Authenticated can create template stat rows"
ON public.template_stats FOR INSERT
TO authenticated
WITH CHECK (clone_count >= 0);

CREATE POLICY "Authenticated can bump template stat rows"
ON public.template_stats FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (clone_count >= 0);

GRANT INSERT, UPDATE ON public.template_stats TO authenticated;

CREATE OR REPLACE FUNCTION public.increment_template_clone(_template_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_count INTEGER;
BEGIN
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