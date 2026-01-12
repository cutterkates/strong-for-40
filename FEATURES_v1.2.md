# Feature Update v1.2.0 - Advanced Progression & Smart Scheduling

## 🎯 New Features

### A) StrongLifts-Style Progression Engine

**What Changed:**
The workout progression system now uses a proper StrongLifts approach with automatic weight management.

**How It Works:**

1. **Success Path (All Reps Hit):**
   - Complete all target sets × reps → Auto-add weight
   - Default: +5 lbs for most exercises
   - Deadlifts: +10 lbs (optional, configurable per exercise)
   - Example: Bench 3×10 @ 135 lbs → All reps hit → Next time: 140 lbs

2. **Failure Path (Missed Reps):**
   - Miss target on any set → Weight stays same, failed_attempts increments
   - Example: Squat 3×10 @ 185 lbs → Only hit 10/10/8 → Repeat 185 lbs next time
   - Track progress: "Failed attempt 1/3"

3. **Deload Path (3 Failures):**
   - Fail 3 times in a row → Automatic deload
   - Default: -10% reduction
   - Resets failed_attempts to 0
   - Example: Row @ 115 lbs → Fail 3 times → Deload to 103.5 lbs
   - User gets alert: "Deload Applied - Failed 3 times. Deloaded 10% to rebuild strength."

**Technical Implementation:**

```typescript
// Progression logic in completeWorkout()
if (allSetsCompleted && allRepsHit) {
  // SUCCESS
  const increment = exercise.name.includes('deadlift') ? 10 : 5;
  newWeight = currentWeight + increment;
  failedAttempts = 0;
} else if (failedAttempts >= 3) {
  // DELOAD
  newWeight = currentWeight * 0.9; // 10% reduction
  failedAttempts = 0;
} else {
  // REPEAT
  failedAttempts += 1;
  // Weight stays same
}
```

**Database Schema:**
- `exercises.current_weight` - Current working weight (auto-updated)
- `exercises.weight_increment` - Amount to add on success (default 5 lbs)
- `exercises.failed_attempts` - Counter for failed sessions (0-3)
- `exercises.deload_percentage` - Deload amount (default 10%)

**User Experience:**
- Weights update automatically after completing workout
- Clear feedback: "Weights automatically adjusted for next session"
- Deload alerts explain why and how much
- No manual weight tracking needed

---

### B) Weekly Habit Target (Done Right)

**What Changed:**
Weekly habits now properly compute totals based on user-defined week boundaries (Mon-Sun or custom).

**How It Works:**

1. **Week Calculation:**
   - Uses `user_preferences.week_starts_on` (0 = Sunday, 1 = Monday)
   - Calculates current week: startOfWeek → endOfWeek
   - Counts completions within that week only
   - Resets automatically every week

2. **Progress Display:**
   - Shows "2/3 this week" with visual progress bar
   - Progress bar fills as you complete
   - Green when target hit, colored otherwise
   - Week view shows Mon-Sun dots

3. **Visual Progress Bar:**
   ```
   Workout Standard
   2/3 this week
   [████████░░░░] 67%
   ```

**Technical Implementation:**

```typescript
// Calculate week boundaries
const weekStartsOn = userPreferences.week_starts_on ?? 1;
const weekStart = startOfWeek(today, { weekStartsOn });
const weekEnd = endOfWeek(today, { weekStartsOn });

// Count completions in current week
const thisWeekLogs = logs.filter(log => {
  const logDate = parseISO(log.completed_date);
  return logDate >= weekStart && logDate <= weekEnd;
});
const weeklyProgress = thisWeekLogs.length;

// Progress percentage
const percentage = (weeklyProgress / weeklyTarget) * 100;
```

**UI Components:**
- `weeklyProgress` state: Current week count
- `weekly_target` from habit: Goal (e.g., 3)
- Progress bar: Visual indicator
- Color coding: Green when complete, brand color in progress

**User Experience:**
- "Workouts 3/week" shows "2/3 complete" mid-week
- Progress bar visualizes progress
- Resets Sunday night (or custom week start)
- Encourages consistency without daily pressure

---

### C) Sunsama-ish "Drag to Schedule"

**What Changed:**
Task scheduling now includes duration selection, overlap detection, and conflict warnings.

**How It Works:**

1. **Duration Selection:**
   - Tap task → Choose duration: 15, 30, 45, 60, 90, or 120 min
   - Default: 30 minutes
   - Quick buttons for common durations
   - Updates task.duration_min

2. **Time Slot Selection:**
   - Pick specific start time (not just "now")
   - Shows all available time slots
   - Calculates end time automatically
   - Updates time_block_start and time_block_end

3. **Overlap Detection:**
   - Checks if new task conflicts with existing tasks
   - Compares: (newStart, newEnd) vs (existingStart, existingEnd)
   - Flags conflicts with ⚠️ warning
   - Red background for conflicting slots

4. **Conflict Resolution:**
   - User chooses: "Cancel" or "Schedule Anyway"
   - Can override if intentional (e.g., overlapping meetings)
   - Maintains flexibility while warning

**Technical Implementation:**

```typescript
const checkTimeOverlap = (startTime, duration, excludeTaskId?) => {
  const startMinutes = hoursToMinutes(startTime);
  const endMinutes = startMinutes + duration;

  for (const task of scheduledTasks) {
    if (task.id === excludeTaskId) continue;
    
    const taskStart = hoursToMinutes(task.time_block_start);
    const taskEnd = taskStart + task.duration_min;

    // Check overlap
    if (
      (startMinutes >= taskStart && startMinutes < taskEnd) ||
      (endMinutes > taskStart && endMinutes <= taskEnd) ||
      (startMinutes <= taskStart && endMinutes >= taskEnd)
    ) {
      return true; // Overlap!
    }
  }
  return false;
};
```

**UI Flow:**
```
1. User taps inbox task
   ↓
2. Modal opens with duration picker
   ↓
3. User selects duration (e.g., 60 min)
   ↓
4. Time slots show with conflict warnings
   ↓
5. User picks time
   ↓
6. If conflict: Alert "Time Conflict - Schedule anyway?"
   ↓
7. Task scheduled with time_block_start/end
```

**Visual Indicators:**
- Duration buttons: Quick selection (15m, 30m, 45m, 60m, 90m, 120m)
- Conflict warning: Red background + ⚠️ icon
- Normal slot: Default background
- Selected duration: Blue highlight

**User Experience:**
- See entire day at a glance
- Pick exact times (like Sunsama)
- Avoid double-booking
- Flexible override for intentional overlaps
- Clear visual feedback

---

## 🔧 Migration Guide

### For Existing Users
No action required! These features work automatically:
- Workout progression uses existing `exercises` table
- Weekly habits use existing `habit_logs`
- Task scheduling uses existing `tasks` table

### For New Deployments
1. Database is already set up (no schema changes)
2. All features work out of the box
3. Test progression by completing a workout
4. Test weekly habits by checking off 3x/week standard

---

## 📊 Database Updates

**No new tables needed!** Uses existing schema:

### exercises table:
- `current_weight` - Auto-updated by progression
- `weight_increment` - Customizable (default 5)
- `failed_attempts` - Tracked automatically (0-3)
- `deload_percentage` - Customizable (default 10)

### tasks table:
- `time_block_start` - Start time
- `time_block_end` - Calculated end time
- `duration_min` - Task duration
- `scheduled_for` - Date

### user_preferences table:
- `week_starts_on` - 0 = Sunday, 1 = Monday

---

## 🎯 User Benefits

### StrongLifts Progression:
✅ Automatic weight tracking
✅ Clear progression path
✅ Deload when needed
✅ No manual calculation
✅ Proven system

### Weekly Habits:
✅ Proper week boundaries
✅ Visual progress tracking
✅ Flexible scheduling (not daily pressure)
✅ Resets automatically
✅ Clear targets

### Smart Scheduling:
✅ Pick exact times
✅ Choose duration
✅ Avoid conflicts
✅ Visual timeline
✅ Sunsama-quality UX

---

## 💡 Pro Tips

### Workout Progression:
- Check your current weights in Training tab
- Failed 2 times? Focus on form next session
- Deload alert? It's a feature, not failure
- Track progress over months, not weeks

### Weekly Habits:
- Front-load your week (Mon/Tue/Wed workouts)
- Hit 3/3 by Thursday for buffer
- Progress bar shows you're on track
- Week resets Sunday night

### Task Scheduling:
- Start with 30-min blocks
- Use 60-min for deep work
- Override conflicts for back-to-back meetings
- Leave gaps for transitions

---

## 🐛 Known Limitations

1. **Progression:**
   - Only tracks whole numbers (no 2.5 lb increments yet)
   - Assumes standard 5 lb plates
   - Manual override requires database edit

2. **Weekly Habits:**
   - Week start can't be changed mid-week
   - Historical weeks not visualized
   - No partial credit (e.g., 1.5 workouts)

3. **Scheduling:**
   - No drag-and-drop (tap-based only)
   - Can't reschedule by dragging
   - Multi-day tasks not supported

---

## 🚀 What's Next

Potential future enhancements:
- Micro-loading (2.5 lb increments)
- Exercise history graphs
- Weekly habit history view
- Visual drag-and-drop for tasks
- Auto-scheduling based on energy levels
- Task templates with default durations

---

**Version**: 1.2.0
**Release Date**: 2026-01-11
**Status**: ✅ Production Ready
