ALTER TABLE collections
  DROP CONSTRAINT IF EXISTS collections_user_id_fkey;

ALTER TABLE collections
  ADD CONSTRAINT collections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
