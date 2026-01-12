# Strong for 40 - Life OS

A comprehensive life operating system **web app** (also works on iOS & Android) built with Expo (React Native) and Supabase, designed for productivity, habit tracking, and progressive strength training.

## 🌐 Universal App - One Codebase, All Platforms

- ✅ **Web Browser** - Works instantly at a URL (Chrome, Safari, Firefox, Edge)
- ✅ **iOS** - Can be deployed to App Store
- ✅ **Android** - Can be deployed to Play Store
- ✅ **PWA** - Install on home screen like a native app

**Run as web app:** `npm run web` → Opens in browser at `localhost:8081`

## Features

### 📅 Today Screen
- Visual timeline with 30-minute time blocks (6 AM - 10 PM)
- **Smart scheduling** with duration selection (15, 30, 45, 60, 90, 120 min)
- **Overlap detection** - Warns about time conflicts
- Sunsama-style time picking - Choose exact start time
- Inbox for unscheduled tasks
- Quick task creation
- Real-time task management

### ✅ Tasks
- Full CRUD operations for tasks
- GTD-style workflow (Inbox, Today, Next, Waiting, Someday, Completed)
- Task details: title, notes, duration, due date, status
- Project and area associations
- Clean status-based grouping

### ⭐ Standards
**Your brand from day one - preloaded standards:**
- Daily: Meditation, Coffee, 10-min walk, Stretch, Water, Kids dropoff done
- Weekly: Workout (Mon/Wed/Fri - 3x per week)
- Visual week view with completion tracking
- **Weekly progress bars** - See "2/3 complete" with visual indicator
- Automatic streak calculation (respects user-defined week start)
- **Add custom standards** - Create your own
- **Delete standards** - Remove unwanted ones (× button on each card)
- Tap to complete, build consistency

### 💪 Training
- A/B workout program (Mon/Wed/Fri schedule)
- Exercise tracking with sets, reps, and weight
- **StrongLifts-style automatic progression**:
  - Complete all sets/reps → Auto-add +5 lbs (+10 for deadlifts)
  - Fail to complete → Repeat same weight
  - Fail 3 times in a row → Auto-deload 10%
  - Tracks current working weight per exercise
- Per-exercise progression tracking with failed attempts
- Workout session history
- Quick-log buttons for fast set entry

## Tech Stack

- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: React Hooks + Supabase Realtime
- **Offline Support**: AsyncStorage caching
- **Navigation**: Expo Router (file-based routing)

## Project Structure

```
strong-for-40/
├── app/                      # Expo Router pages
│   ├── _layout.tsx          # Root layout with tab navigation
│   ├── auth.tsx             # Authentication screen
│   ├── index.tsx            # Today screen
│   ├── tasks.tsx            # Tasks management
│   ├── habits.tsx           # Standards tracking (file still named habits.tsx)
│   ├── training.tsx         # Workout tracking
│   └── settings.tsx         # Settings & profile
├── lib/                      # Utilities
│   ├── supabase.ts          # Supabase client & types
│   ├── cache.ts             # Offline caching layer
│   └── utils.ts             # Date/time utilities
├── supabase-migration.sql   # Database schema & RLS
├── package.json
├── app.json
├── tsconfig.json
└── babel.config.js
```

## Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio (for emulators)
- Supabase account (free tier works great)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd strong-for-40
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database provisioning (~2 minutes)

#### Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase-migration.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** to execute the migration

This will create:
- All database tables (tasks, standards/habits, workouts, exercises, etc.)
- Default standards (Meditation, Coffee, 10-min walk, Stretch, Water, Kids dropoff, Workout)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamps
- Helper functions and views
- Automatic onboarding for new users

#### Get Your Credentials

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy your **anon/public key** (starts with `eyJ...`)

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the App

Start the development server:

```bash
npm start
```

Then choose your platform:
- Press `w` for **Web browser** (recommended for development)
- Press `i` for iOS Simulator (Mac only)
- Press `a` for Android Emulator
- Scan QR code with Expo Go app (iOS/Android)

**For web development:**
```bash
npm run web
# Opens in browser at http://localhost:8081
```

## First-Time Setup

### Create an Account

1. Open the app
2. Tap "Don't have an account? Sign Up"
3. Enter email and password
4. **Your account is auto-configured with:**
   - ✅ Default life areas (Health, Career, Relationships, Personal Growth)
   - ⭐ Daily standards (Meditation, Coffee, 10-min walk, Stretch, Water, Kids dropoff)
   - 💪 Weekly workout standard (Mon/Wed/Fri)
   - 🏋️ A/B workout program template

Everything you need is ready from day one!

### Optional: Add Sample Workout Exercises

The workout program is created automatically, but you can add detailed exercises by running `seed-data.sql` in Supabase SQL Editor. This adds a complete set of exercises for Workout A and B.

### Optional: Manual Seeding

If automatic seeding didn't work, you can run it manually in Supabase SQL Editor:

```sql
SELECT seed_user_data(auth.uid());
```

1. In Supabase dashboard, go to **Table Editor**
2. Create workout program:
   ```sql
   INSERT INTO workout_programs (user_id, name, description, is_active)
   VALUES (auth.uid(), 'A/B Split Program', '3x per week', true);
   ```

3. Create workouts (Workout A and B):
   ```sql
   -- Get the program_id from the previous insert
   INSERT INTO workouts (user_id, program_id, name, sort_order)
   VALUES 
     (auth.uid(), 'program_id_here', 'Workout A', 0),
     (auth.uid(), 'program_id_here', 'Workout B', 1);
   ```

4. Add exercises to each workout:
   ```sql
   -- For Workout A (get workout_id from workouts table)
   INSERT INTO exercises (user_id, workout_id, name, target_sets, target_reps, current_weight)
   VALUES
     (auth.uid(), 'workout_a_id', 'Squat', 3, 10, 135),
     (auth.uid(), 'workout_a_id', 'Bench Press', 3, 10, 115),
     (auth.uid(), 'workout_a_id', 'Bent-Over Row', 3, 10, 95);

   -- For Workout B
   INSERT INTO exercises (user_id, workout_id, name, target_sets, target_reps, current_weight)
   VALUES
     (auth.uid(), 'workout_b_id', 'Deadlift', 3, 8, 185),
     (auth.uid(), 'workout_b_id', 'Overhead Press', 3, 10, 75),
     (auth.uid(), 'workout_b_id', 'Pull-ups', 3, 8, 0);
   ```

## Usage Guide

### Managing Tasks

1. **Quick Add**: Tap the "+ Quick add task" button on Today screen
2. **Schedule Tasks**: Tap an inbox task to assign it to a time block
3. **Complete Tasks**: Long-press any task to mark it complete
4. **Edit Tasks**: Go to Tasks tab, tap a task to edit details
5. **Delete Tasks**: Tap the × button on any task card

### Maintaining Your Standards

1. **Pre-loaded Standards**: Your account comes with 7 default standards
   - Daily: Meditation, Coffee, 10-min walk, Stretch, Water, Kids dropoff
   - Weekly: Workout (3x/week on Mon/Wed/Fri)
2. **Check In**: Tap the circle button to mark today as complete
3. **Build Streaks**: Daily standards track consecutive days
4. **View Progress**: See week view with completion dots
5. **Create New**: Tap "+ New Standard" to add your own

### Training Workouts

**Suggested schedule: Monday / Wednesday / Friday**

1. **Start Session**: Tap on Workout A or B (alternate each session)
2. **Log Sets**: Use quick-log buttons (target reps or -1)
3. **Track Progress**: Visual set indicators show completion
4. **Complete Workout**: Tap "Complete Workout" when done
5. **Progression**: 
   - Green sets = hit target reps
   - Yellow sets = completed but missed reps
   - Auto weight increase/decrease based on performance

## Database Schema

### Key Tables

- **areas**: Life areas (Health, Career, etc.)
- **projects**: Temporary task containers
- **tasks**: Individual actionable items
- **habits**: Recurring habits (daily/weekly)
- **habit_logs**: Completion records
- **workout_programs**: Training programs
- **workouts**: Individual workouts (A, B)
- **exercises**: Exercise definitions with progression
- **workout_sessions**: Completed session logs
- **exercise_sets**: Individual set performance

### Security

All tables have Row Level Security (RLS) enabled:
- Users can only access their own data
- Auth required for all operations
- Automatic `user_id` verification

## Offline Support

The app includes offline caching using AsyncStorage:
- Today's tasks cached for 24 hours
- Habits and logs cached for 24 hours
- Workout data cached for 24 hours
- Pull-to-refresh updates cache
- Works offline with cached data

## Customization

### Adjust Time Blocks

Edit `app/index.tsx`:

```typescript
const timeBlocks = generateTimeBlocks('05:00', '23:00', 60); // 5am-11pm, 1-hour blocks
```

### Change Theme Colors

All screens use a dark theme with these base colors:
- Background: `#0F172A` (slate-900)
- Cards: `#1E293B` (slate-800)
- Primary: `#3B82F6` (blue-500)
- Success: `#10B981` (green-500)

Edit the StyleSheet in any screen to customize.

### Modify Progression Rules

Edit `app/training.tsx` in the `completeWorkout()` function:

```typescript
// Current: +5 lbs on success
const newWeight = exercise.current_weight + exercise.weight_increment;

// Change to: +10 lbs on success
const newWeight = exercise.current_weight + 10;
```

## Troubleshooting

### "Network request failed"

1. Check `.env` file has correct Supabase URL and key
2. Ensure no trailing slashes in URL
3. Try restarting the dev server: `npm start --reset-cache`

### "Row Level Security policy violation"

1. Ensure you're signed in
2. Check that RLS policies were created (run migration again)
3. Verify `auth.uid()` matches `user_id` in queries

### App crashes on startup

1. Clear cache: `npm start --reset-cache`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Check for JavaScript errors in console

### Data not syncing

1. Pull to refresh on the screen
2. Check internet connection
3. Clear app cache in Settings tab
4. Sign out and sign back in

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

Requires an [Expo Application Services (EAS)](https://expo.dev/eas) account.

## Roadmap

Potential future enhancements:
- [ ] Projects and areas CRUD in UI
- [ ] Calendar view for tasks and workouts
- [ ] Habit graphs and analytics
- [ ] Exercise history charts
- [ ] Dark/light theme toggle
- [ ] Workout rest timer
- [ ] Push notifications for habits
- [ ] Weekly review screen
- [ ] Data export (CSV/JSON)

## License

MIT License - feel free to use this as a template for your own projects!

## Support

For issues or questions:
1. Check this README
2. Review the Supabase logs
3. Check the Expo console for errors
4. Open an issue on GitHub

---

Built with ❤️ using Expo and Supabase
