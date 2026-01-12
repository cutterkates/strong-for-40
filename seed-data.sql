-- Seed Data Script for Strong for 40
-- Run this AFTER signing up to populate your account with sample data
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users table

-- Or use this dynamic version that automatically finds your user:

DO $$
DECLARE
  v_user_id UUID;
  v_health_area_id UUID;
  v_career_area_id UUID;
  v_program_id UUID;
  v_workout_a_id UUID;
  v_workout_b_id UUID;
BEGIN
  -- Get the current user (assumes you're signed in)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please sign up first.';
  END IF;
  
  RAISE NOTICE 'Seeding data for user: %', v_user_id;
  
  -- ============================================================================
  -- AREAS
  -- ============================================================================
  INSERT INTO areas (user_id, name, color, icon, sort_order)
  VALUES
    (v_user_id, 'Health & Fitness', '#EF4444', '💪', 1),
    (v_user_id, 'Career', '#3B82F6', '💼', 2),
    (v_user_id, 'Relationships', '#EC4899', '❤️', 3),
    (v_user_id, 'Personal Growth', '#8B5CF6', '🌱', 4),
    (v_user_id, 'Finance', '#10B981', '💰', 5)
  RETURNING id INTO v_health_area_id;
  
  SELECT id INTO v_career_area_id FROM areas WHERE user_id = v_user_id AND name = 'Career';
  
  -- ============================================================================
  -- PROJECTS
  -- ============================================================================
  INSERT INTO projects (user_id, area_id, name, description, status, color)
  VALUES
    (v_user_id, v_health_area_id, 'Get Strong for 40', 'Build muscle and strength before turning 40', 'active', '#EF4444'),
    (v_user_id, v_career_area_id, 'Q1 Launch', 'Launch new product feature', 'active', '#3B82F6');
  
  -- ============================================================================
  -- TASKS
  -- ============================================================================
  INSERT INTO tasks (user_id, area_id, title, notes, status, duration_min, scheduled_for, priority)
  VALUES
    (v_user_id, v_health_area_id, 'Morning workout', 'Workout A - Upper body', 'today', 60, CURRENT_DATE, 1),
    (v_user_id, v_health_area_id, 'Meal prep for the week', 'Chicken, rice, vegetables', 'today', 90, CURRENT_DATE, 2),
    (v_user_id, v_career_area_id, 'Review PRs', NULL, 'today', 30, CURRENT_DATE, 1),
    (v_user_id, v_career_area_id, 'Team standup', NULL, 'today', 15, CURRENT_DATE, 1),
    (v_user_id, NULL, 'Buy groceries', 'Eggs, chicken, vegetables, protein powder', 'inbox', 45, NULL, 0),
    (v_user_id, NULL, 'Call dentist', 'Schedule cleaning appointment', 'inbox', 10, NULL, 0),
    (v_user_id, v_career_area_id, 'Prepare Q1 presentation', NULL, 'next', 120, NULL, 2);
  
  -- ============================================================================
  -- STANDARDS (formerly HABITS) - Brand defaults for "Strong for 40"
  -- ============================================================================
  INSERT INTO habits (user_id, area_id, name, description, frequency_type, weekly_target, color, icon, sort_order)
  VALUES
    -- Core daily standards
    (v_user_id, v_health_area_id, 'Meditation', '10 minutes of mindfulness', 'daily', NULL, '#8B5CF6', '🧘‍♂️', 1),
    (v_user_id, NULL, 'Coffee', 'Morning ritual', 'daily', NULL, '#78350F', '☕', 2),
    (v_user_id, v_health_area_id, '10-min walk', 'Daily movement outside', 'daily', NULL, '#10B981', '🚶', 3),
    (v_user_id, v_health_area_id, 'Stretch', 'Morning mobility routine', 'daily', NULL, '#EC4899', '🤸', 4),
    (v_user_id, v_health_area_id, 'Water', 'Hydration check (8 glasses)', 'daily', NULL, '#0EA5E9', '💧', 5),
    (v_user_id, NULL, 'Kids dropoff done', 'Morning routine complete', 'daily', NULL, '#F59E0B', '🚗', 6),
    -- Weekly standards
    (v_user_id, v_health_area_id, 'Workout', 'Strength training (Mon/Wed/Fri)', 'weekly', 3, '#EF4444', '💪', 7),
    (v_user_id, NULL, 'Read for 30 min', 'Books or articles', 'daily', NULL, '#6366F1', '📚', 8),
    (v_user_id, v_career_area_id, 'Deep Work', '2-hour focused work block', 'weekly', 5, '#3B82F6', '🎯', 9);
  
  -- Log some habit completions for the past week
  INSERT INTO habit_logs (user_id, habit_id, completed_date)
  SELECT 
    v_user_id,
    h.id,
    d.date
  FROM habits h
  CROSS JOIN (
    SELECT CURRENT_DATE - INTERVAL '6 days' + (n || ' days')::INTERVAL AS date
    FROM generate_series(0, 6) n
  ) d
  WHERE h.user_id = v_user_id
    AND h.frequency_type = 'daily'
    AND RANDOM() > 0.3; -- 70% completion rate
  
  -- ============================================================================
  -- WORKOUT PROGRAM
  -- ============================================================================
  INSERT INTO workout_programs (user_id, name, description, is_active)
  VALUES (v_user_id, 'A/B Split Program', '3x per week alternating upper/lower body', true)
  RETURNING id INTO v_program_id;
  
  -- ============================================================================
  -- WORKOUTS
  -- ============================================================================
  INSERT INTO workouts (user_id, program_id, name, description, sort_order)
  VALUES
    (v_user_id, v_program_id, 'Workout A', 'Upper Body - Push & Pull', 0),
    (v_user_id, v_program_id, 'Workout B', 'Lower Body - Squat & Hinge', 1)
  RETURNING id INTO v_workout_a_id;
  
  SELECT id INTO v_workout_b_id FROM workouts 
  WHERE user_id = v_user_id AND program_id = v_program_id AND name = 'Workout B';
  
  -- ============================================================================
  -- EXERCISES - Workout A (Upper Body)
  -- ============================================================================
  INSERT INTO exercises (
    user_id, workout_id, name, notes, 
    target_sets, target_reps, current_weight, 
    weight_increment, deload_percentage, sort_order
  )
  VALUES
    -- Compound movements
    (v_user_id, v_workout_a_id, 'Barbell Bench Press', 'Chest, triceps, shoulders', 
     3, 10, 135, 5, 10, 0),
    (v_user_id, v_workout_a_id, 'Bent-Over Barbell Row', 'Back, biceps', 
     3, 10, 115, 5, 10, 1),
    (v_user_id, v_workout_a_id, 'Overhead Press', 'Shoulders, triceps', 
     3, 10, 75, 5, 10, 2),
    
    -- Accessories
    (v_user_id, v_workout_a_id, 'Dumbbell Flyes', 'Chest isolation', 
     3, 12, 30, 5, 10, 3),
    (v_user_id, v_workout_a_id, 'Face Pulls', 'Rear delts, upper back', 
     3, 15, 60, 5, 10, 4),
    (v_user_id, v_workout_a_id, 'Barbell Curls', 'Biceps', 
     3, 12, 60, 5, 10, 5),
    (v_user_id, v_workout_a_id, 'Tricep Pushdowns', 'Triceps', 
     3, 12, 70, 5, 10, 6);
  
  -- ============================================================================
  -- EXERCISES - Workout B (Lower Body)
  -- ============================================================================
  INSERT INTO exercises (
    user_id, workout_id, name, notes, 
    target_sets, target_reps, current_weight, 
    weight_increment, deload_percentage, sort_order
  )
  VALUES
    -- Compound movements
    (v_user_id, v_workout_b_id, 'Barbell Back Squat', 'Quads, glutes, core', 
     3, 10, 185, 5, 10, 0),
    (v_user_id, v_workout_b_id, 'Romanian Deadlift', 'Hamstrings, glutes, back', 
     3, 10, 155, 5, 10, 1),
    (v_user_id, v_workout_b_id, 'Bulgarian Split Squats', 'Single-leg strength', 
     3, 10, 35, 5, 10, 2),
    
    -- Accessories
    (v_user_id, v_workout_b_id, 'Leg Press', 'Quad emphasis', 
     3, 12, 270, 10, 10, 3),
    (v_user_id, v_workout_b_id, 'Leg Curls', 'Hamstrings isolation', 
     3, 12, 90, 5, 10, 4),
    (v_user_id, v_workout_b_id, 'Calf Raises', 'Calves', 
     3, 15, 180, 10, 10, 5),
    (v_user_id, v_workout_b_id, 'Plank', 'Core stability (hold for 60s)', 
     3, 60, 0, 0, 0, 6);
  
  -- ============================================================================
  -- USER PREFERENCES
  -- ============================================================================
  INSERT INTO user_preferences (user_id, week_starts_on, day_start_time, day_end_time, theme)
  VALUES (v_user_id, 1, '06:00:00', '22:00:00', 'dark')
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Successfully seeded data for user %', v_user_id;
  RAISE NOTICE '---';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '- 5 life areas';
  RAISE NOTICE '- 2 projects';
  RAISE NOTICE '- 7 tasks (4 for today, 3 in inbox/next)';
  RAISE NOTICE '- 6 habits (3 daily, 3 weekly)';
  RAISE NOTICE '- 1 workout program with 2 workouts';
  RAISE NOTICE '- 14 exercises (7 per workout)';
  RAISE NOTICE '- User preferences';
  RAISE NOTICE '---';
  RAISE NOTICE 'You can now use the app with sample data!';
  
END $$;
