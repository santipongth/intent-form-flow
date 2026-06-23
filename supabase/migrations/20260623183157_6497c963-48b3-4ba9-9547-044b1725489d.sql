-- Set immutable search_path on helpers that were missing it
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pg_temp;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pg_temp;

-- Revoke public/anon/authenticated EXECUTE on SECURITY DEFINER functions; allow only service_role
DO $$
DECLARE
  fn record;
  sigs text[] := ARRAY[
    'public.move_to_dlq(text, text, bigint, jsonb)',
    'public.read_email_batch(text, integer, integer)',
    'public.delete_email(text, bigint)',
    'public.enqueue_email(text, jsonb)',
    'public.handle_new_user()',
    'public.get_platform_stats()',
    'public.increment_api_key_usage(uuid, uuid, timestamptz)'
  ];
  sig text;
BEGIN
  FOREACH sig IN ARRAY sigs LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', sig);
  END LOOP;
END $$;