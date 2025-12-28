-- Add collection_id to learning_paths
ALTER TABLE learning_paths 
ADD COLUMN IF NOT EXISTS collection_id uuid references collections(id) on delete set null;

-- Add collection_id to habits
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS collection_id uuid references collections(id) on delete set null;

-- Add collection_id to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS collection_id uuid references collections(id) on delete set null;

-- Add collection_id to goals
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS collection_id uuid references collections(id) on delete set null;

-- Add collection_id to notes
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS collection_id uuid references collections(id) on delete set null;
