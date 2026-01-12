# Quick Start Guide - Strong for 40

Get up and running in 10 minutes!

## Step 1: Install Dependencies (2 min)

```bash
cd strong-for-40
npm install
```

## Step 2: Set Up Supabase (5 min)

### Create Project
1. Go to [supabase.com](https://supabase.com) and sign up/in
2. Click "New Project"
3. Name: `strong-for-40`
4. Password: (choose a strong password)
5. Region: Choose closest to you
6. Click "Create new project"
7. Wait ~2 minutes for provisioning

### Run Migration
1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Open `supabase-migration.sql` from this project
4. Copy all contents (Cmd+A, Cmd+C)
5. Paste into SQL Editor (Cmd+V)
6. Click **Run** (or Cmd+Enter)
7. You should see "Success. No rows returned"

### Get Credentials
1. Go to **Settings** > **API** (left sidebar)
2. Copy **Project URL** (e.g., `https://abcdefg.supabase.co`)
3. Copy **anon public** key (long string starting with `eyJ...`)

## Step 3: Configure App (1 min)

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and paste your credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-here.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-key-here
```

## Step 4: Run the App (2 min)

```bash
npm start
```

Then press:
- **i** for iOS Simulator (Mac only)
- **a** for Android Emulator
- Or scan QR with Expo Go app on your phone

## Step 5: Create Account & Sign In

1. App opens to sign-in screen
2. Tap "Don't have an account? Sign Up"
3. Enter email and password
4. Account created with **instant defaults**:
   - ⭐ 7 pre-loaded standards (Meditation, Coffee, Walk, Stretch, Water, Kids dropoff, Workout)
   - 📋 4 life areas (Health, Career, Relationships, Personal Growth)
   - 💪 A/B workout program (Mon/Wed/Fri schedule)
5. Sign in and start using immediately!

## Step 6: Add Sample Workout Program (Optional)

In Supabase SQL Editor, run:

```sql
-- Replace auth.uid() with your actual user ID from the auth.users table
-- Or use this helper which gets it automatically:

DO $$
DECLARE
  v_user_id UUID;
  v_program_id UUID;
  v_workout_a_id UUID;
  v_workout_b_id UUID;
BEGIN
  -- Get the first user (change this if you have multiple users)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- Create program
  INSERT INTO workout_programs (user_id, name, description, is_active)
  VALUES (v_user_id, 'A/B Split Program', '3x per week alternating', true)
  RETURNING id INTO v_program_id;
  
  -- Create Workout A
  INSERT INTO workouts (user_id, program_id, name, description, sort_order)
  VALUES (v_user_id, v_program_id, 'Workout A', 'Upper body focus', 0)
  RETURNING id INTO v_workout_a_id;
  
  -- Create Workout B
  INSERT INTO workouts (user_id, program_id, name, description, sort_order)
  VALUES (v_user_id, v_program_id, 'Workout B', 'Lower body focus', 1)
  RETURNING id INTO v_workout_b_id;
  
  -- Add exercises to Workout A
  INSERT INTO exercises (user_id, workout_id, name, target_sets, target_reps, current_weight, sort_order)
  VALUES
    (v_user_id, v_workout_a_id, 'Bench Press', 3, 10, 135, 0),
    (v_user_id, v_workout_a_id, 'Bent-Over Row', 3, 10, 115, 1),
    (v_user_id, v_workout_a_id, 'Overhead Press', 3, 10, 75, 2),
    (v_user_id, v_workout_a_id, 'Bicep Curls', 3, 12, 30, 3);
  
  -- Add exercises to Workout B
  INSERT INTO exercises (user_id, workout_id, name, target_sets, target_reps, current_weight, sort_order)
  VALUES
    (v_user_id, v_workout_b_id, 'Squat', 3, 10, 185, 0),
    (v_user_id, v_workout_b_id, 'Romanian Deadlift', 3, 10, 155, 1),
    (v_user_id, v_workout_b_id, 'Leg Press', 3, 12, 270, 2),
    (v_user_id, v_workout_b_id, 'Leg Curls', 3, 12, 90, 3);
    
  RAISE NOTICE 'Sample workout program created successfully!';
END $$;
```

## You're Done! 🎉

Now you can:

### Today Screen
- Add quick tasks
- Drag tasks to time blocks
- See your daily timeline

### Tasks Tab
- Create tasks with full details
- Organize by status (Inbox, Today, Next, etc.)
- Edit and delete tasks

### Standards Tab ⭐
- **Pre-loaded from day one:**
  - Daily: Meditation, Coffee, 10-min walk, Stretch, Water, Kids dropoff
  - Weekly: Workout (Mon/Wed/Fri - 3x/week)
- Tap to check-in
- Track streaks and weekly progress
- Add your own standards

### Training Tab 💪
- Select Workout A or B (Mon/Wed/Fri)
- Log sets with quick buttons
- Watch automatic weight progression

### Settings Tab
- View account info
- Clear cache
- Sign out

## Common Issues

**Q: App shows "Network request failed"**
A: Double-check your `.env` file has the correct Supabase URL and key

**Q: Can't create tasks/standards**
A: Make sure you ran the SQL migration in Supabase

**Q: Don't see default standards**
A: The seed function runs automatically on signup. If missing, run `SELECT seed_user_data(auth.uid());` in Supabase SQL Editor

**Q: App crashes on iOS**
A: Clear cache with `npm start --reset-cache`

## Next Steps

- Read the full `README.md` for detailed features
- Customize time blocks in `app/index.tsx`
- Add your own exercises in Supabase
- Explore the database schema in `supabase-migration.sql`

---

**Need Help?** Check the main README.md or Supabase documentation.
