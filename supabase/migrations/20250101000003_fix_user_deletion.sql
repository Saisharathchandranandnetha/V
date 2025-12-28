-- Add ON DELETE CASCADE to user_id foreign keys

-- Notes table
ALTER TABLE notes
  DROP CONSTRAINT IF EXISTS notes_user_id_fkey, -- Drop assuming default name
  ADD CONSTRAINT notes_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Resources table
ALTER TABLE resources
  DROP CONSTRAINT IF EXISTS resources_user_id_fkey,
  ADD CONSTRAINT resources_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Learning Paths table
ALTER TABLE learning_paths
  DROP CONSTRAINT IF EXISTS learning_paths_user_id_fkey,
  ADD CONSTRAINT learning_paths_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
