-- Drop existing view policy to update it
DROP POLICY IF EXISTS "Users can view roadmap step links" ON roadmap_step_links;

-- Recreate View Policy with Chat Sharing Logic
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
        )) OR
        -- Chat Sharing Logic
        EXISTS (
          SELECT 1 FROM chat_shared_items
          JOIN team_members ON team_members.team_id = chat_shared_items.team_id
          WHERE chat_shared_items.shared_item_id = roadmaps.id
          AND chat_shared_items.shared_type = 'roadmap'
          AND team_members.user_id = auth.uid()
        )
      )
    )
  );
