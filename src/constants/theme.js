// App-wide theme constants

// Light theme colors (default)
export const LIGHT_COLORS = {
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4A42DB',
  secondary: '#FF6B6B',
  accent: '#4ECDC4',
  success: '#2ECC71',
  warning: '#F39C12',
  danger: '#E74C3C',
  info: '#3498DB',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8F9FD',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E8E8F0',
  disabled: '#BDC3C7',

  // Text
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  textLight: '#95A5A6',
  textInverse: '#FFFFFF',

  // Finance
  income: '#2ECC71',
  expense: '#E74C3C',

  // Priority
  priorityLow: '#3498DB',
  priorityMedium: '#F39C12',
  priorityHigh: '#E67E22',
  priorityUrgent: '#E74C3C',

  // Calendar event types
  calendarTask: '#6C63FF',
  calendarEvent: '#F39C12',
  calendarBill: '#E74C3C',
  calendarSchedule: '#4ECDC4',
};

// Dark theme colors
export const DARK_COLORS = {
  primary: '#8B85FF',
  primaryLight: '#A9A4FF',
  primaryDark: '#6C63FF',
  secondary: '#FF8A8A',
  accent: '#6EDDD5',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  background: '#0F1117',
  surface: '#1A1D27',
  card: '#1A1D27',
  border: '#2A2D3A',
  disabled: '#4A4D5A',

  // Text
  textPrimary: '#F1F2F6',
  textSecondary: '#A0A4B8',
  textLight: '#6B7080',
  textInverse: '#0F1117',

  // Finance
  income: '#4ADE80',
  expense: '#F87171',

  // Priority
  priorityLow: '#60A5FA',
  priorityMedium: '#FBBF24',
  priorityHigh: '#FB923C',
  priorityUrgent: '#F87171',

  // Calendar event types
  calendarTask: '#8B85FF',
  calendarEvent: '#FBBF24',
  calendarBill: '#F87171',
  calendarSchedule: '#6EDDD5',
};

// Default export for backward compat (screens not yet using ThemeContext)
export const COLORS = LIGHT_COLORS;

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    title: 32,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Finance categories
export const EXPENSE_CATEGORIES = [
  { key: 'tuition', label: 'Tuition', icon: 'school-outline' },
  { key: 'books', label: 'Books', icon: 'book-outline' },
  { key: 'supplies', label: 'School Supplies', icon: 'pencil-outline' },
  { key: 'transportation', label: 'Transportation', icon: 'bus-outline' },
  { key: 'food', label: 'Food', icon: 'fast-food-outline' },
  { key: 'lab_fees', label: 'Lab Fees', icon: 'flask-outline' },
  { key: 'printing', label: 'Printing', icon: 'print-outline' },
  { key: 'allowance', label: 'Allowance', icon: 'wallet-outline' },
  { key: 'savings', label: 'Savings', icon: 'trending-up-outline' },
  { key: 'miscellaneous', label: 'Miscellaneous', icon: 'ellipsis-horizontal-outline' },
];

export const INCOME_CATEGORIES = [
  { key: 'allowance', label: 'Allowance', icon: 'wallet-outline' },
  { key: 'scholarship', label: 'Scholarship', icon: 'ribbon-outline' },
  { key: 'part_time', label: 'Part-time Job', icon: 'briefcase-outline' },
  { key: 'freelance', label: 'Freelance', icon: 'laptop-outline' },
  { key: 'gift', label: 'Gift', icon: 'gift-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export const TASK_TYPES = [
  { key: 'assignment', label: 'Assignment' },
  { key: 'homework', label: 'Homework' },
  { key: 'project', label: 'Project' },
  { key: 'lab', label: 'Lab' },
  { key: 'reading', label: 'Reading' },
  { key: 'submission', label: 'Submission' },
  { key: 'other', label: 'Other' },
];

export const EVENT_TYPES = [
  { key: 'quiz', label: 'Quiz' },
  { key: 'exam', label: 'Exam' },
  { key: 'recitation', label: 'Recitation' },
  { key: 'presentation', label: 'Presentation' },
  { key: 'defense', label: 'Defense' },
  { key: 'other', label: 'Other' },
];

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const PRIORITY_LEVELS = [
  { key: 'low', label: 'Low', color: COLORS.priorityLow },
  { key: 'medium', label: 'Medium', color: COLORS.priorityMedium },
  { key: 'high', label: 'High', color: COLORS.priorityHigh },
  { key: 'urgent', label: 'Urgent', color: COLORS.priorityUrgent },
];

// Reminder presets (minutes before event)
export const REMINDER_PRESETS = [
  { key: 15, label: '15 min' },
  { key: 30, label: '30 min' },
  { key: 60, label: '1 hour' },
  { key: 180, label: '3 hours' },
  { key: 1440, label: '1 day' },
  { key: 4320, label: '3 days' },
  { key: 10080, label: '1 week' },
];

// Accent color choices for personalization
export const ACCENT_COLORS = [
  '#6C63FF', '#FF6B6B', '#4ECDC4', '#F39C12', '#2ECC71',
  '#3498DB', '#E67E22', '#9B59B6', '#1ABC9C', '#E74C3C',
  '#00BCD4', '#FF5722', '#795548', '#607D8B',
];

// Calendar legend items
export const CALENDAR_LEGEND = [
  { label: 'Tasks', color: COLORS.calendarTask },
  { label: 'Events', color: COLORS.calendarEvent },
  { label: 'Bills', color: COLORS.calendarBill },
];
