UPDATE public.agents SET model = CASE lower(replace(coalesce(model,''), ' ', ''))
  WHEN 'gpt-4o' THEN 'openai/gpt-5'
  WHEN 'gpt4o' THEN 'openai/gpt-5'
  WHEN 'gpt-4omini' THEN 'openai/gpt-5-mini'
  WHEN 'gpt-4o-mini' THEN 'openai/gpt-5-mini'
  WHEN 'gpt-4turbo' THEN 'openai/gpt-5'
  WHEN 'gpt-4' THEN 'openai/gpt-5'
  WHEN 'gpt-3.5-turbo' THEN 'openai/gpt-5-nano'
  WHEN 'claude3.5sonnet' THEN 'openai/gpt-5'
  WHEN 'claude3haiku' THEN 'openai/gpt-5-nano'
  WHEN 'geminipro' THEN 'google/gemini-2.5-pro'
  WHEN 'geminiflash' THEN 'google/gemini-2.5-flash'
  WHEN 'llama3.170b' THEN 'google/gemini-2.5-flash'
  WHEN 'mixtral8x7b' THEN 'google/gemini-2.5-flash'
  ELSE model END,
  provider = CASE
    WHEN provider IN ('anthropic','groq') THEN 'openai'
    ELSE provider END
WHERE model IS NOT NULL AND position('/' in model) = 0;