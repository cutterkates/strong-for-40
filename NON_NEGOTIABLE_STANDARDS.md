# Non-Negotiable Standards System

## 🎯 Overview

The app includes **4 core non-negotiable standards** that every user must maintain. These cannot be deleted and represent the fundamental commitments of the Strong for 40 system.

---

## ⭐ The 4 Non-Negotiable Standards

### 1. **10 min Meditation** 🧘‍♂️
- **Frequency:** Daily
- **Description:** Daily mindfulness practice
- **Why:** Mental clarity and stress management
- **Cannot be:** Deleted or disabled

### 2. **Read 20 Pages** 📚
- **Frequency:** Daily
- **Description:** Daily reading habit
- **Why:** Continuous learning and growth
- **Cannot be:** Deleted or disabled

### 3. **Glass of Water** 💧
- **Frequency:** Daily
- **Description:** Stay hydrated
- **Why:** Basic health foundation
- **Cannot be:** Deleted or disabled

### 4. **Workout** 💪
- **Frequency:** Weekly (3x per week)
- **Description:** Strength training (Mon/Wed/Fri suggested)
- **Why:** Physical fitness and longevity
- **Cannot be:** Deleted or disabled

---

## 🔒 How It Works

### Database Level

**Column added to `habits` table:**
```sql
is_required BOOLEAN DEFAULT false
```

**Non-negotiable standards are created with:**
```sql
INSERT INTO habits (name, is_required, ...)
VALUES ('10 min Meditation', true, ...);
```

### Application Level

**Delete Prevention:**
- Required standards show a 🔒 lock icon instead of × delete icon
- Tapping the lock shows: "Cannot Delete - This is a non-negotiable standard"
- Background is gray instead of red
- No confirmation dialog (action is blocked immediately)

**Visual Indicators:**
```
┌─────────────────────────────────────┐
│ ⭐ NON-NEGOTIABLE                   │  ← Badge
│                                     │
│ 10 min Meditation              ✓ 🔒│  ← Lock icon
│ Daily mindfulness practice          │
│                                     │
│ M T W T F S S                       │
│ ● ● ● ○ ○ ○ ○                      │
│                                     │
│ 3 day streak    365 total           │
└─────────────────────────────────────┘
```

**Optional standards:**
```
┌─────────────────────────────────────┐
│ Coffee                          ✓ × │  ← Delete (X) icon
│ Morning ritual                      │
│                                     │
│ Can be deleted                      │
└─────────────────────────────────────┘
```

---

## 📊 User Experience

### On Signup

New users automatically get:
- ✅ 4 non-negotiable standards (cannot delete)
- ✅ 5 optional standards (can delete)
- Total: 9 standards

### During Use

**Required standards:**
- Always visible
- Cannot be archived or deleted
- Must be completed (accountability)
- Count toward overall progress

**Optional standards:**
- Can be deleted
- User can add more
- Customizable to personal needs

---

## 💡 Philosophy

### Why Non-Negotiable?

**Strong for 40** is about maintaining high standards as you approach a milestone age. The 4 core standards represent:

1. **Mental Health** (Meditation)
2. **Intellectual Growth** (Reading)
3. **Physical Foundation** (Water)
4. **Physical Strength** (Workouts)

These are **non-negotiable** because they're the minimum viable baseline for showing up as your best self.

### The Message

"These aren't suggestions. They're commitments. You signed up for Strong for 40 because you want to maintain high standards. These 4 are your baseline."

---

## 🎨 UI/UX Details

### Visual Hierarchy

**Non-negotiable standards:**
- ⭐ Badge at top: "NON-NEGOTIABLE"
- Golden/amber color scheme
- Lock icon (🔒) instead of delete (×)
- Gray delete button (disabled state)
- Listed first (sort_order 1-4)

**Optional standards:**
- No badge
- Normal color scheme
- Delete icon (×) available
- Red delete button (enabled state)
- Listed after required ones

### User Feedback

**Attempting to delete required standard:**
```
┌─────────────────────────────────────┐
│          Cannot Delete              │
├─────────────────────────────────────┤
│                                     │
│ "10 min Meditation" is a            │
│ non-negotiable standard and         │
│ cannot be deleted.                  │
│                                     │
│ This is one of your core            │
│ commitments.                        │
│                                     │
│              [OK]                   │
└─────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Database Schema

```sql
CREATE TABLE habits (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,  ← New field
    is_active BOOLEAN DEFAULT true,
    ...
);
```

### Seed Function

```sql
-- Create non-negotiable standards
INSERT INTO habits (name, is_required, ...) VALUES
    ('10 min Meditation', true, ...),
    ('Read 20 Pages', true, ...),
    ('Glass of Water', true, ...),
    ('Workout', true, ...);
```

### App Logic

```typescript
const deleteHabit = (habitId, habitName, isRequired) => {
  if (isRequired) {
    Alert.alert(
      'Cannot Delete',
      `"${habitName}" is a non-negotiable standard...`
    );
    return; // Block deletion
  }
  
  // Normal deletion flow for optional standards
  // ...
};
```

### UI Conditional Rendering

```tsx
{habit.is_required && (
  <View style={styles.requiredBadge}>
    <Text>⭐ NON-NEGOTIABLE</Text>
  </View>
)}

<TouchableOpacity
  style={[
    styles.deleteButton,
    habit.is_required && styles.deleteButtonDisabled
  ]}
  onPress={() => deleteHabit(habit.id, habit.name, habit.is_required)}
>
  <Text>{habit.is_required ? '🔒' : '×'}</Text>
</TouchableOpacity>
```

---

## 📈 Business Logic

### Accountability

Non-negotiable standards create accountability:
- User knows what's expected
- No option to "opt out"
- Builds discipline
- Creates identity ("I'm someone who does these 4 things")

### Flexibility

Optional standards provide flexibility:
- User can customize beyond core 4
- Personal preferences respected
- Room for experimentation
- Can remove what doesn't work

### Balance

4 required + unlimited optional = Perfect balance:
- Not overwhelming (only 4 must-dos)
- Not restrictive (add as many as you want)
- Clear expectations
- Personal autonomy

---

## 🎯 Success Metrics

Track completion rates:

**Non-negotiable standards:**
- Target: 95%+ completion (daily)
- Target: 100% completion (weekly workout - all 3 sessions)

**Optional standards:**
- Target: 70%+ completion
- More flexibility expected

**If user consistently misses required standards:**
- In-app coaching tips
- Reminders
- Progress reports

---

## 🚀 Future Enhancements

### Possible Additions

1. **Customizable Required Standards**
   - Let users choose their own 4 non-negotiables
   - System suggests defaults
   - Can change once per month

2. **Streak Protection**
   - Extra emphasis on required standard streaks
   - Warnings before breaking streak
   - Recovery prompts

3. **Completion Badges**
   - Special badges for 30/60/90 day required standard streaks
   - "Perfect Month" achievement

4. **Social Accountability**
   - Share required standard completion
   - Accountability partners
   - Leaderboards

---

## ✅ Implementation Checklist

### Database
- [x] Add `is_required` column to habits table
- [x] Update seed_user_data function
- [x] Set 4 standards as required by default
- [x] Mark optional standards as is_required = false

### App Code
- [x] Add is_required to Habit interface
- [x] Update deleteHabit to check is_required
- [x] Show alert if attempting to delete required
- [x] Change delete icon to lock for required standards
- [x] Add "NON-NEGOTIABLE" badge
- [x] Style disabled delete button differently

### Documentation
- [x] Create NON_NEGOTIABLE_STANDARDS.md
- [x] Update README with new system
- [x] Add to changelog

---

## 💬 User Communication

### In-App Copy

**Welcome message (after signup):**
"Welcome to Strong for 40! You've got 4 non-negotiable standards ready: Meditation, Reading, Water, and Workouts. These are your baseline commitments. Check them off daily to build momentum!"

**Settings explanation:**
"Non-negotiable standards (⭐) represent your core commitments and cannot be deleted. You can add custom standards that are optional."

**Attempting deletion:**
"This is a non-negotiable standard and cannot be deleted. It's one of your core commitments."

---

## 🎓 Best Practices

### For Users

1. **Start with the 4 required standards only**
   - Master the basics first
   - Don't overwhelm yourself
   - Add optional standards gradually

2. **Complete required standards first thing**
   - Morning meditation
   - Morning reading
   - Morning water
   - Schedule workouts Mon/Wed/Fri

3. **Track honestly**
   - Check off only when truly complete
   - Build real habits, not fake streaks

### For Developers

1. **Never bypass is_required check**
   - Security at database and app level
   - No admin override in UI

2. **Clear visual distinction**
   - Required vs optional must be obvious
   - Use consistent iconography

3. **Respectful messaging**
   - Not "You can't delete this"
   - Instead "This is a core commitment"

---

**Summary:** The 4 non-negotiable standards create a strong foundation while allowing flexibility through optional standards. They're the core of what makes Strong for 40 about maintaining high standards, not just tracking habits.
