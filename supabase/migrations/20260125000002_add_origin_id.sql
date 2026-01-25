-- Add original_item_id to content tables to track shared sources (matching existing code expectations)
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS original_item_id UUID REFERENCES notes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS copied_from_chat BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS copied_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS original_item_id UUID REFERENCES resources(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS copied_from_chat BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS copied_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE learning_paths 
ADD COLUMN IF NOT EXISTS original_item_id UUID REFERENCES learning_paths(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS copied_from_chat BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS copied_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_original_item ON notes(original_item_id);
CREATE INDEX IF NOT EXISTS idx_resources_original_item ON resources(original_item_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_original_item ON learning_paths(original_item_id);
