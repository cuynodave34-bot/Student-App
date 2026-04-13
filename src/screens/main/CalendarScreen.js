import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Card from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS, CALENDAR_LEGEND } from '../../constants/theme';

export default function CalendarScreen() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [dayItems, setDayItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMonthData = useCallback(async (monthStr) => {
    if (!user) return;

    // Get the first and last day of the visible month
    const [y, m] = monthStr ? monthStr.split('-') : [new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, '0')];
    const start = `${y}-${m}-01`;
    const end = `${y}-${m}-31`;

    const [tasksRes, eventsRes, billsRes] = await Promise.all([
      supabase.from('tasks').select('id, title, due_date, priority, status, task_type')
        .eq('user_id', user.id).gte('due_date', start).lte('due_date', end),
      supabase.from('academic_events').select('id, title, event_date, event_type, event_time')
        .eq('user_id', user.id).gte('event_date', start).lte('event_date', end),
      supabase.from('payment_reminders').select('id, title, due_date, amount, is_paid')
        .eq('user_id', user.id).gte('due_date', start).lte('due_date', end),
    ]);

    const marks = {};
    const addDot = (date, color) => {
      if (!marks[date]) marks[date] = { dots: [] };
      if (marks[date].dots.length < 4) {
        marks[date].dots.push({ color });
      }
    };

    (tasksRes.data ?? []).forEach((t) => addDot(t.due_date, COLORS.primary));
    (eventsRes.data ?? []).forEach((e) => addDot(e.event_date, COLORS.warning));
    (billsRes.data ?? []).forEach((b) => addDot(b.due_date, COLORS.expense));

    setMarkedDates(marks);
  }, [user]);

  const fetchDayItems = useCallback(async (date) => {
    if (!user) return;

    const [tasksRes, eventsRes, billsRes] = await Promise.all([
      supabase.from('tasks').select('id, title, due_date, due_time, priority, status, task_type')
        .eq('user_id', user.id).eq('due_date', date),
      supabase.from('academic_events').select('id, title, event_date, event_time, event_type')
        .eq('user_id', user.id).eq('event_date', date),
      supabase.from('payment_reminders').select('id, title, due_date, amount, is_paid')
        .eq('user_id', user.id).eq('due_date', date),
    ]);

    const items = [
      ...(tasksRes.data ?? []).map((t) => ({ ...t, _type: 'task' })),
      ...(eventsRes.data ?? []).map((e) => ({ ...e, _type: 'event' })),
      ...(billsRes.data ?? []).map((b) => ({ ...b, _type: 'bill' })),
    ];
    setDayItems(items);
  }, [user]);

  useEffect(() => {
    const now = new Date();
    fetchMonthData(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    fetchDayItems(selectedDate);
  }, [fetchMonthData, fetchDayItems, selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDayItems(selectedDate);
    setRefreshing(false);
  };

  const getSelectedMarks = () => {
    const base = markedDates[selectedDate] || {};
    return {
      ...markedDates,
      [selectedDate]: {
        ...base,
        selected: true,
        selectedColor: COLORS.primary,
      },
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        onMonthChange={(month) => fetchMonthData(`${month.year}-${String(month.month).padStart(2, '0')}`)}
        markedDates={getSelectedMarks()}
        markingType="multi-dot"
        theme={{
          backgroundColor: COLORS.background,
          calendarBackground: COLORS.surface,
          selectedDayBackgroundColor: COLORS.primary,
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.textPrimary,
          textDisabledColor: COLORS.disabled,
          monthTextColor: COLORS.textPrimary,
          arrowColor: COLORS.primary,
          textMonthFontWeight: '700',
          textDayFontSize: 14,
          textMonthFontSize: 16,
        }}
      />

      {/* Legend + Today Button */}
      <View style={styles.legendRow}>
        <View style={styles.legendItems}>
          {CALENDAR_LEGEND.map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          style={styles.todayButton}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.dayList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.dayTitle}>
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {dayItems.length === 0 ? (
          <Text style={styles.emptyHint}>Nothing scheduled for this day</Text>
        ) : (
          dayItems.map((item) => (
            <Card key={`${item._type}-${item.id}`}>
              <View style={styles.itemRow}>
                <View style={[styles.typeDot, { backgroundColor: getTypeColor(item._type) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemMeta}>
                    {item._type === 'task' && `📋 ${item.task_type} · ${item.status}`}
                    {item._type === 'event' && `📝 ${item.event_type}${item.event_time ? ` · ${item.event_time.slice(0, 5)}` : ''}`}
                    {item._type === 'bill' && `💰 ${item.is_paid ? 'Paid' : 'Unpaid'}${item.amount ? ` · ₱${item.amount}` : ''}`}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getTypeColor(type) {
  return { task: COLORS.primary, event: COLORS.warning, bill: COLORS.expense }[type] || COLORS.textLight;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  legendItems: { flexDirection: 'row', gap: SPACING.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  todayButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: RADIUS.full,
  },
  todayButtonText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '600' },
  dayList: { flex: 1, padding: SPACING.lg },
  dayTitle: { fontSize: FONTS.sizes.xl, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.md },
  emptyHint: { fontSize: FONTS.sizes.md, color: COLORS.textLight, fontStyle: 'italic', textAlign: 'center', marginTop: SPACING.xl },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  typeDot: { width: 10, height: 10, borderRadius: 5 },
  itemTitle: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  itemMeta: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2, textTransform: 'capitalize' },
});
