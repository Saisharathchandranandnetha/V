ALTER TABLE teams
  DROP CONSTRAINT IF EXISTS teams_created_by_fkey;

ALTER TABLE teams
  ADD CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

ALTER TABLE projects
  ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
