-- Remove duplicate indexes identified by Supabase linter
DROP INDEX IF EXISTS public.idx_goals_user_id;
DROP INDEX IF EXISTS public.idx_habits_user_id;
DROP INDEX IF EXISTS public.idx_message_reads_user_id;
DROP INDEX IF EXISTS public.idx_notes_user_id;
DROP INDEX IF EXISTS public.idx_tasks_user_id;
DROP INDEX IF EXISTS public.idx_team_messages_project_id;
DROP INDEX IF EXISTS public.idx_team_messages_team_id;
