-- Add parent_step_id to roadmap_steps for branching
ALTER TABLE roadmap_steps ADD COLUMN parent_step_id uuid REFERENCES roadmap_steps(id) ON DELETE SET NULL;
