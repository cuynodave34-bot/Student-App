import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import QuickAddButton from '../../components/QuickAddButton';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../constants/theme';

export default function DashboardScreen({ navigation }) {
  const { profile, user } = useAuth();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [nextClass, setNextClass] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const [weekDeadlines, setWeekDeadlines] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [monthSpent, setMonthSpent] = useState(0);
  const [monthBudget, setMonthBudget] = useState(0);
  const [savingsProgress, setSavingsProgress] = useState(null);

  const today = new Date();
  const dayOfWeek = today.getDay();

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    const todayStr = today.toISOString().split('T')[0];
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    // Fetch in parallel
    const [
      classRes,
      tasksRes,
      overdueRes,
      eventRes,
      deadlineRes,
      expenseRes,
      monthExpRes,
      budgetRes,
      savingsRes,
    ] = await Promise.all([
      // Next class today
      supabase
        .from('class_schedules')
        .select('*, subjects(name, code, color)')
        .eq('user_id', user.id)
        .eq('day_of_week', dayOfWeek)
        .order('start_time', { ascending: true })
        .limit(1),
      // Today's tasks
      supabase
        .from('tasks')
        .select('*, subjects(name, color)')
        .eq('user_id', user.id)
        .eq('due_date', todayStr)
        .neq('status', 'done')
        .order('priority', { ascending: true })
        .limit(5),
      // Overdue tasks count
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lt('due_date', todayStr)
        .neq('status', 'done'),
      // Next upcoming event
      supabase
        .from('academic_events')
        .select('*, subjects(name, color)')
        .eq('user_id', user.id)
        .gte('event_date', todayStr)
        .order('event_date', { ascending: true })
        .limit(1),
      // Deadlines this week
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('due_date', todayStr)
        .lte('due_date', weekEndStr)
        .neq('status', 'done'),
      // Recent expenses
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .order('transaction_date', { ascending: false })
        .limit(3),
      // Month total spent
      supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('transaction_date', monthStart)
        .lte('transaction_date', todayStr),
      // Month budget
      supabase
        .from('budgets')
        .select('planned_amount')
        .eq('user_id', user.id)
        .eq('month', today.getMonth() + 1)
        .eq('year', today.getFullYear()),
      // Savings goals
      supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    setNextClass(classRes.data?.[0] ?? null);
    setTodayTasks(tasksRes.data ?? []);
    setOverdueTasks(overdueRes.count ?? 0);
    setUpcomingEvent(eventRes.data?.[0] ?? null);
    setWeekDeadlines(deadlineRes.count ?? 0);
    setRecentExpenses(expenseRes.data ?? []);

    const totalSpent = (monthExpRes.data ?? []).reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    setMonthSpent(totalSpent);

    const totalBudget = (budgetRes.data ?? []).reduce(
      (sum, b) => sum + Number(b.planned_amount),
      0
    );
    setMonthBudget(totalBudget);
    setSavingsProgress(savingsRes.data?.[0] ?? null);
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchDashboardData);
    return unsub;
  }, [navigation, fetchDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (n) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const getDaysUntil = (dateStr) => {
    const eventDate = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
  };

  const budgetPct = monthBudget > 0 ? Math.min((monthSpent / monthBudget) * 100, 100) : 0;
  const budgetRemaining = Math.max(monthBudget - monthSpent, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{profile?.full_name || 'Student'} 👋</Text>
          </View>
        </View>

        {/* Quick Add */}
        <View style={styles.quickAddRow}>
          <QuickAddButton
            icon="add-circle-outline"
            label="Task"
            color={COLORS.primary}
            onPress={() => navigation.navigate('Education', { screen: 'AddTask' })}
          />
          <QuickAddButton
            icon="calendar-outline"
            label="Quiz/Event"
            color={COLORS.warning}
            onPress={() => navigation.navigate('Education', { screen: 'AddAcademicEvent' })}
          />
          <QuickAddButton
            icon="cash-outline"
            label="Expense"
            color={COLORS.expense}
            onPress={() => navigation.navigate('Finance', { screen: 'AddTransaction' })}
          />
          <QuickAddButton
            icon="notifications-outline"
            label="Reminder"
            color={COLORS.accent}
            onPress={() => navigation.navigate('Finance', { screen: 'AddBillReminder' })}
          />
        </View>

        {/* Overdue Banner */}
        {overdueTasks > 0 && (
          <TouchableOpacity
            style={styles.overdueBanner}
            onPress={() => navigation.navigate('Education', { screen: 'Tasks' })}
            activeOpacity={0.7}
          >
            <Ionicons name="alert-circle" size={24} color={COLORS.danger} />
            <Text style={styles.overdueText}>
              {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''} need attention
            </Text>
            <Text style={styles.overdueAction}>View →</Text>
          </TouchableOpacity>
        )}

        {/* Next Class */}
        <Card
          title="Next Class"
          icon="school-outline"
          iconColor={COLORS.primary}
          onPress={() => navigation.navigate('Education', { screen: 'Schedule' })}
          rightAction={<Text style={styles.viewAll}>View all</Text>}
        >
          {nextClass ? (
            <View style={styles.classRow}>
              <View style={[styles.colorDot, { backgroundColor: nextClass.subjects?.color || COLORS.primary }]} />
              <View>
                <Text style={styles.classSubject}>{nextClass.subjects?.name}</Text>
                <Text style={styles.classDetail}>
                  {nextClass.start_time?.slice(0, 5)} – {nextClass.end_time?.slice(0, 5)}
                  {nextClass.room ? ` · ${nextClass.room}` : ''}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyHint}>No more classes today 🎉</Text>
          )}
        </Card>

        {/* Today's Tasks */}
        <Card
          title="Due Today"
          icon="checkbox-outline"
          iconColor={COLORS.success}
          subtitle={`${todayTasks.length} pending`}
          onPress={() => navigation.navigate('Education', { screen: 'Tasks' })}
          rightAction={<Text style={styles.viewAll}>View all</Text>}
        >
          {todayTasks.length > 0 ? (
            todayTasks.map((t) => (
              <View key={t.id} style={styles.taskRow}>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(t.priority) }]} />
                <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
                <Text style={styles.taskSubject}>{t.subjects?.name || ''}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyHint}>All caught up — no tasks due today! ✨</Text>
          )}
        </Card>

        {/* Upcoming Quiz/Exam */}
        <Card
          title="Upcoming Event"
          icon="alert-circle-outline"
          iconColor={COLORS.warning}
          onPress={() => navigation.navigate('Education', { screen: 'AcademicEvents' })}
          rightAction={<Text style={styles.viewAll}>View all</Text>}
        >
          {upcomingEvent ? (() => {
            const daysLeft = getDaysUntil(upcomingEvent.event_date);
            const urgencyColor = daysLeft <= 1 ? COLORS.danger : daysLeft <= 3 ? COLORS.warning : COLORS.info;
            return (
              <View style={styles.countdownRow}>
                <View style={[styles.countdownBadge, { backgroundColor: urgencyColor }]}>
                  <Text style={styles.countdownNumber}>{daysLeft}</Text>
                  <Text style={styles.countdownUnit}>{daysLeft === 1 ? 'day' : 'days'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{upcomingEvent.title}</Text>
                  <Text style={styles.eventDetail}>
                    {upcomingEvent.event_type?.toUpperCase()} · {upcomingEvent.event_date}
                    {upcomingEvent.subjects?.name ? ` · ${upcomingEvent.subjects.name}` : ''}
                  </Text>
                </View>
              </View>
            );
          })() : (
            <Text style={styles.emptyHint}>No upcoming events — enjoy the break! 📖</Text>
          )}
        </Card>

        {/* Week Deadlines */}
        <Card title="This Week" icon="time-outline" iconColor={COLORS.info}>
          <View style={styles.weekRow}>
            <View>
              <Text style={styles.statNumber}>{weekDeadlines}</Text>
              <Text style={styles.statLabel}>deadlines</Text>
            </View>
            {overdueTasks > 0 && (
              <View>
                <Text style={[styles.statNumber, { color: COLORS.danger }]}>{overdueTasks}</Text>
                <Text style={[styles.statLabel, { color: COLORS.danger }]}>overdue</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Budget Status */}
        <Card
          title="Budget Status"
          icon="wallet-outline"
          iconColor={COLORS.expense}
          onPress={() => navigation.navigate('Finance', { screen: 'Budget' })}
          rightAction={<Text style={styles.viewAll}>Details</Text>}
        >
          <View style={styles.budgetRow}>
            <View>
              <Text style={styles.budgetLabel}>Spent</Text>
              <Text style={[styles.budgetAmount, { color: COLORS.expense }]}>
                {formatCurrency(monthSpent)}
              </Text>
            </View>
            <View style={styles.budgetDivider} />
            <View>
              <Text style={styles.budgetLabel}>Budget</Text>
              <Text style={[styles.budgetAmount, { color: COLORS.success }]}>
                {formatCurrency(monthBudget)}
              </Text>
            </View>
          </View>
          {monthBudget > 0 ? (
            <>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${budgetPct}%`,
                      backgroundColor:
                        budgetPct > 90
                          ? COLORS.danger
                          : budgetPct > 70
                          ? COLORS.warning
                          : COLORS.success,
                    },
                  ]}
                />
              </View>
              <Text style={[
                styles.remainingText,
                budgetPct > 90 && { color: COLORS.danger },
                budgetPct > 70 && budgetPct <= 90 && { color: COLORS.warning },
              ]}>
                {budgetPct >= 100
                  ? '⚠️ Over budget!'
                  : `${formatCurrency(budgetRemaining)} remaining (${(100 - budgetPct).toFixed(0)}%)`}
              </Text>
            </>
          ) : (
            <Text style={styles.emptyHint}>Set a monthly budget to track spending</Text>
          )}
        </Card>

        {/* Recent Expenses */}
        <Card
          title="Recent Expenses"
          icon="receipt-outline"
          iconColor={COLORS.secondary}
          onPress={() => navigation.navigate('Finance', { screen: 'Transactions' })}
          rightAction={<Text style={styles.viewAll}>View all</Text>}
        >
          {recentExpenses.length > 0 ? (
            recentExpenses.map((e) => (
              <View key={e.id} style={styles.expenseRow}>
                <Text style={styles.expenseCategory}>{e.category}</Text>
                <Text style={styles.expenseAmount}>-{formatCurrency(e.amount)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyHint}>No recent expenses recorded</Text>
          )}
        </Card>

        {/* Savings */}
        {savingsProgress && (
          <Card
            title="Savings Goal"
            icon="trending-up-outline"
            iconColor={COLORS.accent}
            onPress={() => navigation.navigate('Finance', { screen: 'Goals' })}
          >
            <Text style={styles.savingsName}>{savingsProgress.name}</Text>
            <Text style={styles.savingsAmount}>
              {formatCurrency(savingsProgress.current_amount)} / {formatCurrency(savingsProgress.target_amount)}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (Number(savingsProgress.current_amount) /
                        Number(savingsProgress.target_amount)) *
                        100,
                      100
                    )}%`,
                    backgroundColor: COLORS.accent,
                  },
                ]}
              />
            </View>
          </Card>
        )}

        <View style={{ height: SPACING.xxxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getPriorityColor(p) {
  return (
    {
      low: COLORS.priorityLow,
      medium: COLORS.priorityMedium,
      high: COLORS.priorityHigh,
      urgent: COLORS.priorityUrgent,
    }[p] || COLORS.textLight
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  greeting: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary },
  name: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.textPrimary },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: `${COLORS.danger}15`,
    borderWidth: 1,
    borderColor: `${COLORS.danger}30`,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  overdueText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.danger,
  },
  overdueAction: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.danger,
  },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  classSubject: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary },
  classDetail: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  taskSubject: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  countdownBadge: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: { fontSize: 22, fontWeight: '800', color: '#fff' },
  countdownUnit: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  eventTitle: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary },
  eventDetail: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  emptyHint: { fontSize: FONTS.sizes.md, color: COLORS.textLight, fontStyle: 'italic' },
  weekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statNumber: { fontSize: 36, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  statLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center' },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  budgetDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  budgetLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center' },
  budgetAmount: { fontSize: FONTS.sizes.xl, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3 },
  remainingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.success,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  expenseCategory: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, textTransform: 'capitalize' },
  expenseAmount: { fontSize: FONTS.sizes.md, color: COLORS.expense, fontWeight: '600' },
  savingsName: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary },
  savingsAmount: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginVertical: SPACING.xs },
  viewAll: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
});
