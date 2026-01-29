-- Enable RLS on roadmap_step_links
ALTER TABLE roadmap_step_links ENABLE ROW LEVEL SECURITY;

-- View Policy
CREATE POLICY "Users can view roadmap step links" ON roadmap_step_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roadmap_steps
      JOIN roadmaps ON roadmaps.id = roadmap_steps.roadmap_id
      WHERE roadmap_steps.id = roadmap_step_links.step_id
      AND (
        roadmaps.owner_id = auth.uid() OR
        (roadmaps.team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.team_id = roadmaps.team_id
          AND team_members.user_id = auth.uid()
        )) OR
        (roadmaps.project_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM team_members
          JOIN projects ON projects.team_id = team_members.team_id
          WHERE projects.id = roadmaps.project_id
          AND team_members.user_id = auth.uid()
        ))
      )
    )
  );

-- Insert Policy
CREATE POLICY "Users can insert roadmap step links" ON roadmap_step_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM roadmap_steps
      JOIN roadmaps ON roadmaps.id = roadmap_steps.roadmap_id
      WHERE roadmap_steps.id = roadmap_step_links.step_id
      AND roadmaps.owner_id = auth.uid()
    )
  );

-- Update Policy
CREATE POLICY "Users can update roadmap step links" ON roadmap_step_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM roadmap_steps
      JOIN roadmaps ON roadmaps.id = roadmap_steps.roadmap_id
      WHERE roadmap_steps.id = roadmap_step_links.step_id
      AND roadmaps.owner_id = auth.uid()
    )
  );

-- Delete Policy
CREATE POLICY "Users can delete roadmap step links" ON roadmap_step_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM roadmap_steps
      JOIN roadmaps ON roadmaps.id = roadmap_steps.roadmap_id
      WHERE roadmap_steps.id = roadmap_step_links.step_id
      AND roadmaps.owner_id = auth.uid()
    )
  );

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE roadmap_step_links;
