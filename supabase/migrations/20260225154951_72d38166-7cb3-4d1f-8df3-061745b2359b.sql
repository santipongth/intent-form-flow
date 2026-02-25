CREATE TABLE public.ab_test_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.agent_ab_tests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  winner text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ab_test_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own votes"
  ON public.ab_test_votes
  FOR ALL
  USING (auth.uid() = user_id);