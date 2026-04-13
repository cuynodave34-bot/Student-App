# Student Life Organizer — PROJECT_PROGRESS.md

## Tech Stack
- **Framework:** React Native (Expo SDK 54, blank template)
- **Backend:** Supabase (Auth + PostgreSQL + RLS)
- **Navigation:** React Navigation v7 (native-stack, bottom-tabs, material-top-tabs)
- **Calendar:** react-native-calendars
- **Icons:** @expo/vector-icons (Ionicons)
- **Session Storage:** expo-secure-store
- **Storage:** @react-native-async-storage/async-storage (theme persistence, onboarding, biometric settings)
- **Haptics:** expo-haptics (micro-interactions)
- **Gestures:** react-native-gesture-handler (swipe-to-delete)
- **Network:** @react-native-community/netinfo (offline detection)
- **File I/O:** expo-file-system, expo-sharing (CSV export)
- **Notifications:** expo-notifications (local push notifications)
- **Clipboard:** expo-clipboard (copy URLs)
- **Security:** expo-local-authentication (biometric lock)

---

## Folder Structure

```
StudentLifeOrganizer/
├── App.js                          ✅
├── supabase/
│   └── schema.sql                  ✅  (14 tables, RLS, triggers, indexes)
└── src/
    ├── lib/
    │   └── supabase.js             ✅
    ├── constants/
    │   └── theme.js                ✅
    ├── contexts/
    │   ├── AuthContext.js           ✅
    │   ├── ThemeContext.js          ✅  (dark mode with AsyncStorage persistence)
    │   ├── ToastContext.js          ✅  (app-wide toast notifications)
    │   ├── OfflineContext.js        ✅  (NetInfo detection, offline queue, sync banner)
    │   └── NotificationContext.js   ✅  (push notifications, local scheduling)
    ├── components/
    │   ├── Button.js               ✅  (accessibility labels)
    │   ├── Input.js                ✅
    │   ├── Card.js                 ✅
    │   ├── QuickAddButton.js       ✅
    │   ├── LoadingScreen.js        ✅
    │   ├── EmptyState.js           ✅  (action button support, accessibility)
    │   ├── FloatingActionButton.js ✅  (expandable FAB for quick-add)
    │   ├── SearchBar.js            ✅  (reusable search input with clear)
    │   ├── SwipeableRow.js         ✅  (swipe-to-delete gesture wrapper)
    │   ├── SkeletonCard.js         ✅  (animated loading placeholder)
    │   └── ErrorState.js           ✅  (error display with retry button)
    ├── navigation/
    │   ├── RootNavigator.js        ✅  (biometric lock gate)
    │   ├── AuthNavigator.js        ✅  (onboarding flow)
    │   ├── MainNavigator.js        ✅  (bottom tabs)
    │   ├── EducationNavigator.js   ✅  (top tabs + GPA + Timer + Grades + Resources)
    │   └── FinanceNavigator.js     ✅  (top tabs + stack)
    └── screens/
        ├── auth/
        │   ├── WelcomeScreen.js    ✅
        │   ├── OnboardingScreen.js ✅  (3-slide intro with animated dots)
        │   ├── SignUpScreen.js     ✅
        │   ├── LoginScreen.js      ✅
        │   ├── ForgotPasswordScreen.js ✅
        │   └── ResetPasswordScreen.js  ✅
        ├── main/
        │   ├── DashboardScreen.js  ✅
        │   ├── CalendarScreen.js   ✅
        │   └── SettingsScreen.js   ✅  (dark mode, biometric lock, CSV export)
        ├── education/
        │   ├── SubjectsScreen.js   ✅  (search + status filter)
        │   ├── AddSubjectScreen.js ✅  (accent colors + archive status)
        │   ├── SubjectDetailScreen.js ✅  (grades, resources, grade calculator)
        │   ├── TasksScreen.js      ✅  (search, subtask progress, haptics)
        │   ├── AddTaskScreen.js    ✅  (subtask checklists, validation, notifications)
        │   ├── AcademicEventsScreen.js ✅
        │   ├── AddAcademicEventScreen.js ✅  (notifications on save)
        │   ├── ScheduleScreen.js   ✅
        │   ├── AddScheduleScreen.js ✅
        │   ├── NotesScreen.js      ✅  (search)
        │   ├── AddNoteScreen.js    ✅  (formatting toolbar)
        │   ├── GradesScreen.js     ✅  (weighted average, subject filter, search)
        │   ├── AddGradeScreen.js   ✅  (score/max validation, type chips)
        │   ├── ResourcesScreen.js  ✅  (tap-to-open, long-press copy, subject filter)
        │   ├── AddResourceScreen.js ✅  (URL auto-detect type)
        │   ├── GPACalculatorScreen.js ✅  (weighted GPA with grade chips)
        │   └── StudyTimerScreen.js ✅  (Pomodoro timer with haptics)
        └── finance/
            ├── FinanceOverviewScreen.js ✅  (spending breakdown chart)
            ├── TransactionsScreen.js     ✅  (search, recurring badge)
            ├── AddTransactionScreen.js   ✅  (recurrence, payment presets)
            ├── BudgetScreen.js           ✅
            ├── GoalsScreen.js            ✅
            ├── AddGoalScreen.js          ✅  (amount/date validation)
            ├── BillsRemindersScreen.js   ✅  (haptics on toggle)
            ├── AddBillReminderScreen.js  ✅  (recurrence interval, notifications)
```

---

## Database Tables (Supabase)

| # | Table | RLS | Status |
|---|-------|-----|--------|
| 1 | profiles | ✅ | ✅ |
| 2 | subjects | ✅ | ✅ |
| 3 | class_schedules | ✅ | ✅ |
| 4 | tasks | ✅ | ✅ |
| 5 | academic_events | ✅ | ✅ |
| 6 | notes | ✅ | ✅ |
| 7 | transactions | ✅ | ✅ |
| 8 | budgets | ✅ | ✅ |
| 9 | savings_goals | ✅ | ✅ |
| 10 | payment_reminders | ✅ | ✅ |
| 11 | task_subtasks | ✅ | ✅ |
| 12 | grades | ✅ | ✅ |
| 13 | resources | ✅ | ✅ |
| 14 | push_tokens | ✅ | ✅ |

---

## Navigation Flow

```
RootNavigator (theme-aware NavigationContainer + biometric lock)
├── (locked) → Lock Screen (fingerprint unlock)
├── (no session) → AuthNavigator
│   ├── Onboarding (first launch only, 3 slides)
│   ├── Welcome
│   ├── SignUp
│   ├── Login
│   ├── ForgotPassword
│   └── ResetPassword
└── (session) → MainNavigator (bottom tabs + FloatingActionButton)
    ├── Home → DashboardScreen (overdue banner, countdown cards, budget %)
    ├── Edu → EducationNavigator
    │   ├── [Top Tabs] Subjects | Tasks | Events | Schedule | Notes | Grades | Resources | GPA | Timer
    │   └── [Stack] AddSubject, SubjectDetail, AddTask, AddAcademicEvent, AddSchedule, AddNote, AddGrade, AddResource, GPACalculator, StudyTimer
    ├── Finance → FinanceNavigator
    │   ├── [Top Tabs] Overview | Transactions | Budget | Goals | Bills
    │   └── [Stack] AddTransaction, AddGoal, AddBillReminder
    ├── Calendar → CalendarScreen (color legend, today button)
    └── Settings → SettingsScreen (dark mode, biometric lock, notifications, CSV export)
```

---

## Setup Instructions

1. **Install dependencies:** `cd StudentLifeOrganizer && npm install`
2. **Supabase:**
   - Create a project at https://supabase.com
   - Run `supabase/schema.sql` in the SQL Editor
   - Copy your project URL and anon key into `src/lib/supabase.js`
3. **Start:** `npx expo start`
4. **Scan QR** with Expo Go

---

## Status: COMPLETE ✅

All screens, navigation, components, auth flow, and database schema are implemented.
Next steps: connect Supabase credentials, run on device, and iterate on UX.

---

## v1.1 — Quality Improvements (First Wave) ✅

| Feature | Files Changed | Status |
|---------|---------------|--------|
| **Dark Mode** | ThemeContext.js (new), theme.js, App.js, RootNavigator.js, MainNavigator.js, SettingsScreen.js | ✅ |
| **Toast Notifications** | ToastContext.js (new), App.js | ✅ |
| **Quick Add FAB** | FloatingActionButton.js (new), MainNavigator.js | ✅ |
| **Enhanced Dashboard** | DashboardScreen.js (overdue banner, countdown cards, budget %, view-all links, auto-refresh) | ✅ |
| **Reminder Presets** | AddAcademicEventScreen.js (7 preset chips replace manual input) | ✅ |
| **Calendar Legend** | CalendarScreen.js (color-coded legend bar + Today button) | ✅ |
| **Better Empty States** | EmptyState.js (action button support), 8 list screens updated | ✅ |
| **Improved Settings** | SettingsScreen.js (dark mode toggle, appearance card) | ✅ |
| **Theme-Aware Navigation** | RootNavigator.js (navigationTheme), MainNavigator.js (dynamic tab bar colors) | ✅ |

### New Files
- `src/contexts/ThemeContext.js` — Dark/light mode context with AsyncStorage persistence
- `src/contexts/ToastContext.js` — Animated toast notification system (success/error/warning/info)
- `src/components/FloatingActionButton.js` — Expandable FAB with 5 quick-add actions

### New Theme Constants
- `LIGHT_COLORS` / `DARK_COLORS` — Full color palettes including calendar-specific colors
- `REMINDER_PRESETS` — 7 options (15min → 1 week)
- `ACCENT_COLORS` — 14 color choices for future customization
- `CALENDAR_LEGEND` — Color-coded event type legend data

---

## v1.2 — Data & Productivity (Wave 2) ✅

| Feature | Files Changed | Status |
|---------|---------------|--------|
| **Task Subtasks/Checklists** | schema.sql (task_subtasks table), AddTaskScreen.js, TasksScreen.js | ✅ |
| **Search & Filters** | SearchBar.js (new), TasksScreen, SubjectsScreen, NotesScreen, TransactionsScreen | ✅ |
| **Recurring Transactions** | AddTransactionScreen.js, AddBillReminderScreen.js, TransactionsScreen.js | ✅ |
| **Better Form Validation** | AddTaskScreen, AddGoalScreen, AddBillReminderScreen (date/amount validation, smart defaults) | ✅ |
| **Subject Accent Colors & Archive** | AddSubjectScreen.js (ACCENT_COLORS, status picker), SubjectsScreen.js (status filter) | ✅ |

### New Files (Wave 2)
- `src/components/SearchBar.js` — Reusable search input with icon and clear button

### Schema Changes (Wave 2)
- `task_subtasks` table — id, task_id, user_id, title, is_done, sort_order (RLS enabled)

---

## v1.3 — Visual & UX Polish (Wave 3) ✅

| Feature | Files Changed | Status |
|---------|---------------|--------|
| **Spending Bar Chart** | FinanceOverviewScreen.js (top 6 categories) | ✅ |
| **Haptic Feedback** | expo-haptics installed; TasksScreen, BillsRemindersScreen (toggle haptics) | ✅ |
| **Swipe-to-Delete** | SwipeableRow.js (new) — gesture wrapper with delete action | ✅ |
| **Onboarding Flow** | OnboardingScreen.js (new), AuthNavigator.js (AsyncStorage flag) | ✅ |
| **Skeleton Loading** | SkeletonCard.js (new) — animated pulse placeholder | ✅ |
| **Error State** | ErrorState.js (new) — error display with retry button | ✅ |
| **Accessibility** | Button.js, EmptyState.js, SearchBar.js (accessibilityRole, accessibilityLabel) | ✅ |

### New Files (Wave 3)
- `src/components/SwipeableRow.js` — Swipeable gesture wrapper with delete/edit actions
- `src/components/SkeletonCard.js` — Animated loading skeleton placeholder
- `src/components/ErrorState.js` — Error display with retry button
- `src/screens/auth/OnboardingScreen.js` — 3-slide intro (academics, finance, calendar)

---

## v1.4 — Advanced Features (Wave 4) ✅

| Feature | Files Changed | Status |
|---------|---------------|--------|
| **Note Formatting Toolbar** | AddNoteScreen.js (bold, italic, list, heading toolbar + large editor) | ✅ |
| **Offline Queue & Sync** | OfflineContext.js (new), App.js (provider); NetInfo detection, queue persistence, sync banner | ✅ |
| **CSV Export** | SettingsScreen.js (export transactions, tasks, notes via Sharing API) | ✅ |
| **Biometric App Lock** | SettingsScreen.js (toggle), RootNavigator.js (lock gate on launch) | ✅ |
| **Payment Method Presets** | AddTransactionScreen.js (Cash, GCash, Maya, Bank Transfer, Credit/Debit Card chips) | ✅ |
| **GPA Calculator** | GPACalculatorScreen.js (new), EducationNavigator.js (tab + stack) | ✅ |
| **Study Timer** | StudyTimerScreen.js (new), EducationNavigator.js (Pomodoro with presets + haptics) | ✅ |

### New Files (Wave 4)
- `src/contexts/OfflineContext.js` — Network detection, offline write queue, auto-sync, banner
- `src/screens/education/GPACalculatorScreen.js` — Weighted GPA calculator with PH grade scale
- `src/screens/education/StudyTimerScreen.js` — Pomodoro study timer with session counter

### New Dependencies (Waves 2-4)
- `expo-haptics` — Haptic feedback on toggles and timer
- `@react-native-community/netinfo` — Network connectivity detection
- `expo-file-system` — Write CSV files to cache
- `expo-sharing` — Share/export CSV files
- `expo-local-authentication` — Biometric (fingerprint/face) authentication

---

## v1.5 — Grade Tracker, Push Notifications & Resource Library (Wave 5) ✅

| Feature | Files Changed | Status |
|---------|---------------|--------|
| **Grade Tracker** | GradesScreen.js (new), AddGradeScreen.js (new), SubjectDetailScreen.js (grades section + "what grade do I need?" calculator), EducationNavigator.js (Grades tab + stack), DashboardScreen.js (recent grades card), SettingsScreen.js (grades CSV export) | ✅ |
| **Push Notifications** | NotificationContext.js (new), App.js (provider wrap), AddAcademicEventScreen.js (schedule on save), AddTaskScreen.js (schedule on save), AddBillReminderScreen.js (schedule on save), SettingsScreen.js (notification toggle with cancel/reschedule) | ✅ |
| **Resource Library** | ResourcesScreen.js (new), AddResourceScreen.js (new), SubjectDetailScreen.js (resources section), EducationNavigator.js (Resources tab + stack) | ✅ |
| **FAB Expansion** | FloatingActionButton.js (added Grade + Resource quick-add actions — now 7 actions) | ✅ |

### New Files (Wave 5)
- `src/contexts/NotificationContext.js` — Push notification permissions, token registration, local scheduling, cancellation, reschedule helpers
- `src/screens/education/GradesScreen.js` — Grade list with weighted average summary, subject chip filter, search, SwipeableRow
- `src/screens/education/AddGradeScreen.js` — Add/edit grade form with type chips, subject picker, score validation, percentage preview
- `src/screens/education/ResourcesScreen.js` — Resource list with tap-to-open URL, long-press copy, subject filter, search
- `src/screens/education/AddResourceScreen.js` — Add/edit resource with URL auto-detect type (YouTube → video, Google Docs → document)

### Schema Changes (Wave 5)
- `grades` table — id, user_id, subject_id, title, grade_type, score, max_score, weight, date, notes (RLS, cascade delete)
- `resources` table — id, user_id, subject_id, title, url, resource_type, description (RLS, SET NULL on subject delete)
- `push_tokens` table — id, user_id, expo_push_token, device_name (RLS, unique constraint)

### New Constants (Wave 5)
- `GRADE_TYPES` — quiz, exam, assignment, project, recitation, other
- `RESOURCE_TYPES` — link, video, document, image, other (with Ionicons)

### New Dependencies (Wave 5)
- `expo-clipboard` — Copy resource URLs to clipboard
