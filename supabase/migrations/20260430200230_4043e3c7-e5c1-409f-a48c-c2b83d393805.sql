-- Clear all user data for fresh start
TRUNCATE TABLE public.message_feedback CASCADE;
TRUNCATE TABLE public.ab_test_votes CASCADE;
TRUNCATE TABLE public.agent_ab_tests CASCADE;
TRUNCATE TABLE public.agent_analytics_events CASCADE;
TRUNCATE TABLE public.chat_messages CASCADE;
TRUNCATE TABLE public.conversations CASCADE;
TRUNCATE TABLE public.knowledge_files CASCADE;
TRUNCATE TABLE public.agents CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Delete all auth users
DELETE FROM auth.users;