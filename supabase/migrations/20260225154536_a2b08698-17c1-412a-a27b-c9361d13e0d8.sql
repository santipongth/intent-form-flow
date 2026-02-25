CREATE TABLE public.agent_ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_a_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  agent_b_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.agent_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ab tests"
  ON public.agent_ab_tests
  FOR ALL
  USING (auth.uid() = user_id);