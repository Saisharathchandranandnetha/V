-- Fix RLS policies for tasks to allow assignees to view and update tasks

-- Drop existing policies (handle potential naming variations from previous migrations)
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;

-- Re-create policies with assignee access
-- 1. SELECT: Users can see tasks they created OR tasks assigned to them
CREATE POLICY "Users can view their own or assigned tasks" ON tasks
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to
  );

-- 2. UPDATE: Users can update tasks they created OR tasks assigned to them (e.g. status)
CREATE POLICY "Users can update their own or assigned tasks" ON tasks
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to
  );

-- Note: DELETE and INSERT policies remain unchanged (only creator can delete/insert)
