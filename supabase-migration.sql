-- Strong for 40 - Life OS Database Schema
-- Migration Version: 1.0.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AREAS TABLE (Life Areas: Health, Career, Relationships, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_areas_user_id ON areas(user_id);

-- ============================================================================
-- PROJECTS TABLE (Temporary containers for tasks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    due_date DATE,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_area_id ON projects(area_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ============================================================================
-- TASKS TABLE (GTD-style tasks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'inbox' CHECK (status IN ('inbox', 'today', 'next', 'waiting', 'someday', 'completed')),
    priority INTEGER DEFAULT 0,
    due_at TIMESTAMPTZ,
    duration_min INTEGER,
    scheduled_for DATE,
    time_block_start TIME,
    time_block_end TIME,
    completed_at TIMESTAMPTZ,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_area_id ON tasks(area_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_at ON tasks(due_at);
CREATE INDEX idx_tasks_scheduled_for ON tasks(scheduled_for);

-- ============================================================================
-- HABITS TABLE (Daily and Weekly habits)
-- ============================================================================
CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    frequency_type TEXT DEFAULT 'daily' CHECK (frequency_type IN ('daily', 'weekly')),
    weekly_target INTEGER, -- For weekly habits (e.g., 3 times per week)
    color TEXT DEFAULT '#10B981',
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false, -- Non-negotiable standards that can't be deleted
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_is_active ON habits(is_active);

-- ============================================================================
-- HABIT_LOGS TABLE (Track habit completions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_completed_date ON habit_logs(completed_date);
CREATE UNIQUE INDEX idx_habit_logs_unique ON habit_logs(habit_id, completed_date);

-- ============================================================================
-- WORKOUT_PROGRAMS TABLE (Training programs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workout_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_programs_user_id ON workout_programs(user_id);

-- ============================================================================
-- WORKOUTS TABLE (Individual workouts: Workout A, Workout B, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES workout_programs(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Workout A", "Workout B"
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_program_id ON workouts(program_id);

-- ============================================================================
-- EXERCISES TABLE (Exercise definitions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    notes TEXT,
    target_sets INTEGER NOT NULL DEFAULT 3,
    target_reps INTEGER NOT NULL DEFAULT 10,
    current_weight NUMERIC(6, 2) DEFAULT 0,
    weight_increment NUMERIC(6, 2) DEFAULT 5.0,
    deload_percentage NUMERIC(5, 2) DEFAULT 10.0,
    failed_attempts INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_exercises_workout_id ON exercises(workout_id);

-- ============================================================================
-- WORKOUT_SESSIONS TABLE (Log of completed workout sessions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_workout_id ON workout_sessions(workout_id);
CREATE INDEX idx_workout_sessions_date ON workout_sessions(session_date);

-- ============================================================================
-- EXERCISE_SETS TABLE (Individual set logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercise_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps_completed INTEGER NOT NULL,
    weight_used NUMERIC(6, 2) NOT NULL,
    rpe INTEGER, -- Rate of Perceived Exertion (1-10)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercise_sets_user_id ON exercise_sets(user_id);
CREATE INDEX idx_exercise_sets_session_id ON exercise_sets(session_id);
CREATE INDEX idx_exercise_sets_exercise_id ON exercise_sets(exercise_id);

-- ============================================================================
-- USER_PREFERENCES TABLE (App settings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    week_starts_on INTEGER DEFAULT 1, -- 0 = Sunday, 1 = Monday
    day_start_time TIME DEFAULT '06:00:00',
    day_end_time TIME DEFAULT '22:00:00',
    time_block_duration INTEGER DEFAULT 30, -- minutes
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Areas policies
CREATE POLICY "Users can view own areas" ON areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own areas" ON areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own areas" ON areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own areas" ON areas FOR DELETE USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Habits policies
CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

-- Habit logs policies
CREATE POLICY "Users can view own habit_logs" ON habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit_logs" ON habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit_logs" ON habit_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit_logs" ON habit_logs FOR DELETE USING (auth.uid() = user_id);

-- Workout programs policies
CREATE POLICY "Users can view own workout_programs" ON workout_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout_programs" ON workout_programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout_programs" ON workout_programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout_programs" ON workout_programs FOR DELETE USING (auth.uid() = user_id);

-- Workouts policies
CREATE POLICY "Users can view own workouts" ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON workouts FOR DELETE USING (auth.uid() = user_id);

-- Exercises policies
CREATE POLICY "Users can view own exercises" ON exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercises" ON exercises FOR DELETE USING (auth.uid() = user_id);

-- Workout sessions policies
CREATE POLICY "Users can view own workout_sessions" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout_sessions" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout_sessions" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout_sessions" ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- Exercise sets policies
CREATE POLICY "Users can view own exercise_sets" ON exercise_sets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercise_sets" ON exercise_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercise_sets" ON exercise_sets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercise_sets" ON exercise_sets FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_programs_updated_at BEFORE UPDATE ON workout_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON workout_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Optional - for development)
-- ============================================================================

-- Function to seed initial data for a new user
CREATE OR REPLACE FUNCTION seed_user_data(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_health_area_id UUID;
BEGIN
    -- Create default areas
    INSERT INTO areas (user_id, name, color, icon, sort_order) VALUES
        (p_user_id, 'Health & Fitness', '#EF4444', '💪', 1),
        (p_user_id, 'Career', '#3B82F6', '💼', 2),
        (p_user_id, 'Relationships', '#EC4899', '❤️', 3),
        (p_user_id, 'Personal Growth', '#8B5CF6', '🌱', 4)
    RETURNING id INTO v_health_area_id;
    
    -- Get the health area ID (first one created)
    SELECT id INTO v_health_area_id FROM areas WHERE user_id = p_user_id AND name = 'Health & Fitness';
    
    -- Create default standards (preloaded habits for brand identity)
    -- NON-NEGOTIABLE STANDARDS (is_required = true)
    INSERT INTO habits (user_id, area_id, name, description, frequency_type, weekly_target, color, icon, is_required, sort_order) VALUES
        (p_user_id, v_health_area_id, '10 min Meditation', 'Daily mindfulness practice', 'daily', NULL, '#8B5CF6', '🧘‍♂️', true, 1),
        (p_user_id, NULL, 'Read 20 Pages', 'Daily reading habit', 'daily', NULL, '#6366F1', '📚', true, 2),
        (p_user_id, v_health_area_id, 'Glass of Water', 'Stay hydrated', 'daily', NULL, '#0EA5E9', '💧', true, 3),
        (p_user_id, v_health_area_id, 'Workout', 'Strength training (3x per week)', 'weekly', 3, '#EF4444', '💪', true, 4);
    
    -- Create default user preferences
    INSERT INTO user_preferences (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create default workout program
    INSERT INTO workout_programs (user_id, name, description, is_active)
    VALUES (p_user_id, 'A/B Split Program', 'Mon/Wed/Fri alternating workout program', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS (Optional - for convenient queries)
-- ============================================================================

-- View for today's tasks with time blocks
CREATE OR REPLACE VIEW v_today_schedule AS
SELECT 
    t.id,
    t.user_id,
    t.title,
    t.notes,
    t.status,
    t.duration_min,
    t.time_block_start,
    t.time_block_end,
    t.scheduled_for,
    p.name as project_name,
    p.color as project_color,
    a.name as area_name,
    a.color as area_color
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN areas a ON t.area_id = a.id
WHERE t.scheduled_for = CURRENT_DATE
    OR (t.status = 'today' AND t.scheduled_for IS NULL)
ORDER BY t.time_block_start NULLS LAST, t.sort_order;

-- View for habit streaks
CREATE OR REPLACE VIEW v_habit_streaks AS
WITH streak_calc AS (
    SELECT 
        h.id as habit_id,
        h.user_id,
        h.name,
        h.frequency_type,
        h.weekly_target,
        COUNT(hl.id) as total_completions,
        MAX(hl.completed_date) as last_completed
    FROM habits h
    LEFT JOIN habit_logs hl ON h.id = hl.habit_id
    WHERE h.is_active = true
    GROUP BY h.id, h.user_id, h.name, h.frequency_type, h.weekly_target
)
SELECT 
    habit_id,
    user_id,
    name,
    frequency_type,
    weekly_target,
    total_completions,
    last_completed,
    CASE 
        WHEN last_completed = CURRENT_DATE THEN true
        WHEN last_completed = CURRENT_DATE - INTERVAL '1 day' THEN true
        ELSE false
    END as is_current_streak
FROM streak_calc;

-- Grant access to views
GRANT SELECT ON v_today_schedule TO authenticated;
GRANT SELECT ON v_habit_streaks TO authenticated;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_tasks_user_scheduled ON tasks(user_id, scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_tasks_user_status_today ON tasks(user_id, status) WHERE status = 'today';
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, completed_date);
CREATE INDEX idx_exercise_sets_session_exercise ON exercise_sets(session_id, exercise_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE areas IS 'Life areas for organizing projects and tasks (GTD areas of responsibility)';
COMMENT ON TABLE projects IS 'Temporary containers for related tasks with specific outcomes';
COMMENT ON TABLE tasks IS 'Individual actionable items with optional time blocking';
COMMENT ON TABLE habits IS 'Recurring habits tracked daily or with weekly targets';
COMMENT ON TABLE habit_logs IS 'Records of habit completions for streak tracking';
COMMENT ON TABLE workout_programs IS 'Training programs containing multiple workouts';
COMMENT ON TABLE workouts IS 'Individual workout sessions (e.g., Workout A, B)';
COMMENT ON TABLE exercises IS 'Exercise definitions with progression rules';
COMMENT ON TABLE workout_sessions IS 'Log of completed workout sessions';
COMMENT ON TABLE exercise_sets IS 'Individual set performance logs';
COMMENT ON TABLE user_preferences IS 'User-specific app settings and preferences';

-- ============================================================================
-- AUTOMATIC ONBOARDING - Seed data for new users
-- ============================================================================

-- Trigger function to seed data when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Seed default data for the new user
    PERFORM seed_user_data(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (runs after user creation)
-- Note: This requires Supabase to allow triggers on auth schema
-- Alternative: Call seed_user_data from your app after signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- If the trigger above doesn't work (some Supabase projects don't allow auth triggers),
-- you can call this function manually after signup in your app:
-- Example: await supabase.rpc('seed_user_data', { p_user_id: user.id })

-- End of migration
