# 🎯 Strong for 40 - Life OS MVP

**A complete mobile app for productivity, habits, and progressive strength training**

## 📦 What's Included

This is a fully-functional MVP built with:
- ✅ **Expo (React Native)** - Cross-platform mobile framework
- ✅ **Supabase** - Backend database with auth and RLS
- ✅ **TypeScript** - Type-safe code
- ✅ **Offline-first** - Caching with AsyncStorage

## 🚀 Quick Start (10 Minutes)

### 1. Install Dependencies
```bash
cd strong-for-40
npm install
```

### 2. Set Up Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase-migration.sql` in SQL Editor
3. Copy Project URL and anon key

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Start the App
```bash
npm start
```

Press `i` for iOS or `a` for Android

### 5. Sign Up
1. Create account in the app
2. **Instant setup - you get:**
   - ⭐ 7 default standards ready to track
   - 📋 4 life areas
   - 💪 A/B workout program (Mon/Wed/Fri)
3. Start using immediately!

*Optional: Run `seed-data.sql` to add sample workout exercises*

**📖 Full instructions in `QUICKSTART.md`**

## 🎨 Features

### 📅 Today Screen
- Visual timeline with 30-min time blocks
- Drag tasks to schedule with duration
- Quick-add inbox for unscheduled tasks
- Real-time updates

### ✅ Tasks
- Full CRUD (Create, Read, Update, Delete)
- GTD workflow: Inbox → Today → Next → Waiting → Someday
- Duration tracking
- Status filtering
- Long-press to complete

### ⭐ Standards

**Your brand from day one - automatic defaults:**
- Daily standards: Meditation, Coffee, 10-min walk, Stretch, Water, Kids dropoff done
- Weekly standard: Workout (Mon/Wed/Fri - 3x per week)
- Visual week view with completion dots
- Automatic streak calculation

### 💪 Training
- A/B workout split program
- Suggested schedule: Mon/Wed/Fri
- Exercise tracking: sets × reps @ weight
- **Automatic progression**:
  - Complete all reps → Add +5 lbs
  - Fail to complete → Repeat weight
  - Fail 3x → Deload 10%
- Session history per exercise
- Quick-log buttons

## 📂 Project Structure

```
strong-for-40/
├── app/                    # Screens (Expo Router)
│   ├── index.tsx          # Today timeline
│   ├── tasks.tsx          # Task management
│   ├── habits.tsx         # Habit tracking
│   ├── training.tsx       # Workout tracking
│   ├── settings.tsx       # Settings
│   └── auth.tsx           # Authentication
│
├── lib/                    # Utilities
│   ├── supabase.ts        # Database client
│   ├── cache.ts           # Offline caching
│   └── utils.ts           # Helpers
│
├── Database Scripts
│   ├── supabase-migration.sql   # Schema + RLS
│   └── seed-data.sql            # Sample data
│
└── Documentation
    ├── README.md          # Complete guide
    ├── QUICKSTART.md      # 10-min setup
    ├── DEPLOYMENT.md      # Production guide
    └── STRUCTURE.md       # Architecture details
```

## 🗄️ Database Schema

**11 main tables with full RLS:**
- `areas` - Life areas (Health, Career, etc.)
- `projects` - Task containers
- `tasks` - Actionable items with scheduling
- `habits` - Recurring habits
- `habit_logs` - Completion tracking
- `workout_programs` - Training programs
- `workouts` - Individual workouts (A/B)
- `exercises` - Exercise definitions
- `workout_sessions` - Completed sessions
- `exercise_sets` - Set performance logs
- `user_preferences` - App settings

All tables have:
- Row Level Security (RLS)
- Automatic `user_id` filtering
- Timestamps (`created_at`, `updated_at`)
- Indexes for performance

## 🎯 Key Features

### Offline Support
- 24-hour caching for Today, Habits, Training
- Pull-to-refresh updates
- Works without internet

### Smart Progression
Automatic weight progression for exercises:
```
Complete all reps → +5 lbs next time
Fail → Repeat same weight
Fail 3x → Deload 10%
```

### Time Blocking
- Visual timeline (6 AM - 10 PM)
- 30-minute blocks (customizable)
- Drag tasks from inbox to schedule
- Duration-based scheduling

### Habit Streaks
- Current streak calculation
- Week view with completion dots
- Daily and weekly targets
- Total completion count

## 🔧 Technical Stack

**Frontend:**
- React Native (Expo SDK 50)
- TypeScript
- Expo Router (file-based navigation)
- AsyncStorage (offline caching)
- date-fns (date manipulation)

**Backend:**
- Supabase (PostgreSQL)
- Row Level Security
- Realtime subscriptions
- Authentication

**Development:**
- Hot reload
- TypeScript type checking
- Babel with Reanimated plugin

## 📱 Screens Overview

1. **Today** - Timeline + scheduled tasks + inbox
2. **Tasks** - All tasks grouped by status
3. **Standards** ⭐ - Daily/weekly standards with streaks (preloaded defaults)
4. **Training** - A/B workouts with progression (Mon/Wed/Fri)
5. **Settings** - Account, cache, sign out

## 🎨 Design System

**Dark theme with clean UI:**
- Background: `#0F172A` (slate-900)
- Cards: `#1E293B` (slate-800)
- Primary: `#3B82F6` (blue-500)
- Success: `#10B981` (green-500)
- Danger: `#EF4444` (red-500)

## 🚀 Deployment

Ready to deploy to production:
- iOS App Store
- Google Play Store
- TestFlight beta testing
- Over-the-air (OTA) updates

See `DEPLOYMENT.md` for complete guide.

## 📖 Documentation

- **README.md** - Complete feature guide
- **QUICKSTART.md** - 10-minute setup
- **DEPLOYMENT.md** - Production deployment
- **STRUCTURE.md** - Architecture details

## 🛠️ Development Commands

```bash
npm start          # Start dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser
```

## ✨ Sample Use Cases

### Morning Routine
1. Open app - see your standards for the day
2. Check off morning standards (Coffee ☕, Stretch 🤸, Meditation 🧘‍♂️)
3. Complete "Kids dropoff done" 🚗
4. Schedule tasks from inbox to time blocks
5. Start Workout A if it's Mon/Wed/Fri 💪

### Workout Session (Mon/Wed/Fri)
1. Select Workout A or B (alternate)
2. Log sets with quick buttons
3. Complete workout
4. System automatically adjusts weights for next time
5. Check off "Workout" standard (3x/week)

### Weekly Review
1. Review standard completion streaks
2. Check task completion rate
3. View workout progression (should hit 3x/week Mon/Wed/Fri)
4. Plan next week

## 🔒 Security

- Row Level Security on all tables
- User data isolation
- Secure authentication
- No API key exposure

## 💡 Customization Ideas

- Add more workout programs
- Create custom time blocks
- Add life areas and projects
- Customize habit frequencies
- Modify progression rules

## 📊 Performance

- Offline-first architecture
- Database indexes on key fields
- Efficient query patterns
- Minimal re-renders
- Fast load times

## 🤝 Contributing

This is an MVP template - feel free to:
- Add new features
- Customize for your needs
- Share improvements
- Deploy to production

## 📄 License

MIT License - use freely for personal or commercial projects

## 🎉 Ready to Go!

Everything you need is included:
- ✅ Complete React Native app
- ✅ Supabase database schema
- ✅ **Automatic onboarding with default standards**
- ✅ Row Level Security policies
- ✅ Offline caching
- ✅ Full documentation
- ✅ Sample data scripts
- ✅ Deployment guide

**Your brand from day one:**
- ⭐ 7 pre-loaded daily/weekly standards
- 💪 Mon/Wed/Fri workout schedule
- 📋 Life areas ready to use

**Next Steps:**
1. Follow QUICKSTART.md
2. Sign up and see instant defaults
3. Start tracking your standards!

---

Built with Expo + Supabase • Ready for iOS & Android • MIT Licensed
