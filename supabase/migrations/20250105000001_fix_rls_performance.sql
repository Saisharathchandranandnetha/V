-- Optimizing RLS policies to use (select auth.uid()) for better performance

-- 1. Users
ALTER POLICY "Users can view their own profile" ON users USING ((select auth.uid()) = id);
ALTER POLICY "Users can update their own profile" ON users USING ((select auth.uid()) = id);
ALTER POLICY "Users can insert their own profile" ON users WITH CHECK ((select auth.uid()) = id);

-- 2. Collections
ALTER POLICY "Users can view their own collections" ON collections USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own collections" ON collections WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own collections" ON collections USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own collections" ON collections USING ((select auth.uid()) = user_id);

-- 3. Paths
ALTER POLICY "Users can CRUD own paths" ON paths USING ((select auth.uid()) = user_id);

-- 4. Resources
ALTER POLICY "Users can view their own resources" ON resources USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own resources" ON resources WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own resources" ON resources USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own resources" ON resources USING ((select auth.uid()) = user_id);

-- 5. Learning Paths
ALTER POLICY "Users can view their own learning paths" ON learning_paths USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own learning paths" ON learning_paths WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own learning paths" ON learning_paths USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own learning paths" ON learning_paths USING ((select auth.uid()) = user_id);

-- 6. Habits
ALTER POLICY "Users can view their own habits" ON habits USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own habits" ON habits WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own habits" ON habits USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own habits" ON habits USING ((select auth.uid()) = user_id);

-- 7. Habit Logs
ALTER POLICY "Users can view their own habit logs" ON habit_logs USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = (select auth.uid()))
);
ALTER POLICY "Users can insert their own habit logs" ON habit_logs WITH CHECK (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = (select auth.uid()))
);
ALTER POLICY "Users can update their own habit logs" ON habit_logs USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = (select auth.uid()))
);
ALTER POLICY "Users can delete their own habit logs" ON habit_logs USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = (select auth.uid()))
);

-- 8. Tasks
ALTER POLICY "Users can view their own tasks" ON tasks USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own tasks" ON tasks WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own tasks" ON tasks USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own tasks" ON tasks USING ((select auth.uid()) = user_id);

-- 9. Goals
ALTER POLICY "Users can view their own goals" ON goals USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own goals" ON goals WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own goals" ON goals USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own goals" ON goals USING ((select auth.uid()) = user_id);

-- 10. Categories
ALTER POLICY "Users can view their own categories" ON categories USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own categories" ON categories WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own categories" ON categories USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own categories" ON categories USING ((select auth.uid()) = user_id);

-- 11. Transactions
ALTER POLICY "Users can view their own transactions" ON transactions USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own transactions" ON transactions WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own transactions" ON transactions USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own transactions" ON transactions USING ((select auth.uid()) = user_id);

-- 12. Notes
ALTER POLICY "Users can view their own notes" ON notes USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own notes" ON notes WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own notes" ON notes USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own notes" ON notes USING ((select auth.uid()) = user_id);
