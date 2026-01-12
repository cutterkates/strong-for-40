# Project Structure - Strong for 40

Complete folder and file organization for the Strong for 40 Life OS app.

```
strong-for-40/
│
├── 📱 app/                          # Expo Router - All screens
│   ├── _layout.tsx                 # Root layout with tab navigation
│   ├── auth.tsx                    # Sign in / Sign up screen
│   ├── index.tsx                   # Today screen (timeline + tasks)
│   ├── tasks.tsx                   # All tasks with CRUD
│   ├── habits.tsx                  # Habit tracking with streaks
│   ├── training.tsx                # Workout tracking with progression
│   └── settings.tsx                # Settings and sign out
│
├── 🛠️  lib/                          # Utilities and helpers
│   ├── supabase.ts                 # Supabase client + TypeScript types
│   ├── cache.ts                    # AsyncStorage offline caching
│   └── utils.ts                    # Date/time formatting utilities
│
├── 🗄️  Database/                     # Supabase SQL files
│   ├── supabase-migration.sql      # Main schema with RLS policies
│   └── seed-data.sql               # Sample data for testing
│
├── 📄 Configuration Files
│   ├── package.json                # Dependencies and scripts
│   ├── app.json                    # Expo configuration
│   ├── tsconfig.json               # TypeScript settings
│   ├── babel.config.js             # Babel configuration
│   ├── .env.example                # Environment template
│   ├── .env                        # Your actual credentials (gitignored)
│   └── .gitignore                  # Files to exclude from git
│
├── 📚 Documentation
│   ├── README.md                   # Complete guide with features
│   ├── QUICKSTART.md               # 10-minute setup guide
│   └── DEPLOYMENT.md               # Production deployment guide
│
└── 🎨 assets/                       # Images and icons (create these)
    ├── icon.png                    # App icon (1024x1024)
    ├── splash.png                  # Splash screen (1284x2778)
    ├── adaptive-icon.png           # Android icon (1024x1024)
    └── favicon.png                 # Web favicon (48x48)
```

## File Descriptions

### Core App Files (`app/`)

| File | Purpose | Key Features |
|------|---------|--------------|
| `_layout.tsx` | Root navigation | Tab bar setup, auth checks, styling |
| `auth.tsx` | Authentication | Sign in, sign up, email/password |
| `index.tsx` | Today screen | Timeline, time blocks, quick add tasks |
| `tasks.tsx` | Task management | CRUD, status filters, project links |
| `habits.tsx` | Habit tracking | Daily/weekly habits, streaks, week view |
| `training.tsx` | Workout tracking | A/B workouts, sets/reps, progression |
| `settings.tsx` | App settings | Account info, cache clearing, sign out |

### Library Files (`lib/`)

| File | Purpose | Exports |
|------|---------|---------|
| `supabase.ts` | Database client | `supabase`, `Database` types |
| `cache.ts` | Offline storage | `cacheStorage`, `CacheKeys` |
| `utils.ts` | Helpers | Date/time formatters, time block generator |

### Database Files

| File | Purpose | Contains |
|------|---------|----------|
| `supabase-migration.sql` | Schema definition | Tables, indexes, RLS, triggers, views |
| `seed-data.sql` | Sample data | Test data for all tables |

### Config Files

| File | Purpose | Notes |
|------|---------|-------|
| `package.json` | Dependencies | React Native, Expo, Supabase packages |
| `app.json` | Expo config | App name, version, bundle IDs |
| `tsconfig.json` | TypeScript | Type checking settings |
| `babel.config.js` | Babel | Reanimated plugin |
| `.env` | Secrets | Supabase URL and key (DO NOT COMMIT) |

## Database Schema Overview

```
Users (Supabase Auth)
│
├── areas (Life Areas)
│   └── projects
│       └── tasks
│
├── habits
│   └── habit_logs
│
├── workout_programs
│   └── workouts
│       └── exercises
│           └── exercise_sets
│               └── workout_sessions
│
└── user_preferences
```

## Data Flow

### Task Creation Flow
```
User Input (Today Screen)
    ↓
Create Task (Supabase)
    ↓
Update Cache (AsyncStorage)
    ↓
Refresh UI
```

### Workout Progression Flow
```
Complete Workout Session
    ↓
Calculate Progression
    ├─ All reps completed? → Increase weight (+5 lbs)
    ├─ Failed attempt? → Increment fail counter
    └─ 3 failures? → Deload 10%
    ↓
Update Exercise (Supabase)
    ↓
Refresh UI
```

### Habit Streak Flow
```
Toggle Habit Completion
    ↓
Add/Remove habit_log
    ↓
Calculate Streak
    └─ Count consecutive days from today backward
    ↓
Update UI with new streak
```

## Key Technologies

### Frontend Stack
- **React Native**: Cross-platform mobile
- **Expo**: Development tooling
- **Expo Router**: File-based navigation
- **TypeScript**: Type safety
- **AsyncStorage**: Offline caching
- **date-fns**: Date manipulation

### Backend Stack
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security
  - Authentication
  - Realtime subscriptions
- **SQL**: Schema and queries

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting (recommended)
- **Git**: Version control

## Color Palette

The app uses a dark theme with these primary colors:

```typescript
// Backgrounds
'#0F172A' // slate-900 - Main background
'#1E293B' // slate-800 - Cards

// Borders
'#334155' // slate-700 - Borders
'#1E293B' // slate-800 - Subtle borders

// Text
'#F1F5F9' // slate-100 - Primary text
'#94A3B8' // slate-400 - Secondary text
'#64748B' // slate-500 - Tertiary text

// Accent Colors
'#3B82F6' // blue-500 - Primary actions
'#10B981' // green-500 - Success/habits
'#EF4444' // red-500 - Delete/important
'#F59E0B' // amber-500 - Warning
'#8B5CF6' // purple-500 - Personal growth
'#EC4899' // pink-500 - Relationships
```

## Performance Optimizations

### Caching Strategy
- Cache key data for 24 hours
- Pull-to-refresh updates cache
- Offline-first for Today screen
- Background sync when online

### Database Indexes
- User ID on all tables
- Status on tasks
- Date on habit_logs
- Session ID on exercise_sets

### Code Splitting
- Expo Router handles code splitting automatically
- Each tab loads independently
- Lazy load modals and forms

## Security Features

### Row Level Security (RLS)
- All tables protected by RLS
- Users can only access their own data
- Automatic `user_id` filtering
- Protected from SQL injection

### Authentication
- Supabase Auth handles tokens
- Secure password storage
- Email verification
- Session management

## Next Steps for Development

1. **Add Features**:
   - Calendar view
   - Habit analytics
   - Project/area management UI
   - Exercise history charts
   - Rest timer for workouts

2. **Improve UX**:
   - Add animations
   - Haptic feedback
   - Loading states
   - Error boundaries

3. **Polish**:
   - Custom app icons
   - Onboarding flow
   - Empty states
   - Dark/light theme toggle

4. **Analytics**:
   - Track user engagement
   - Monitor crashes
   - A/B test features

5. **Deploy**:
   - Submit to App Store
   - Submit to Play Store
   - Set up monitoring
   - Create support docs

---

This structure provides a clean, scalable foundation for the Strong for 40 Life OS app.
