-- Add index on foreign key to improve performance
CREATE INDEX IF NOT EXISTS project_members_user_id_idx ON public.project_members (user_id);
