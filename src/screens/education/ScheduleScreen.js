import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { DAYS_OF_WEEK } from '../../constants/theme';

export default function ScheduleScreen({ navigation }) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const fetchSchedules = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('class_schedules')
      .select('*, subjects(name, code, color)')
      .eq('user_id', user.id)
      .eq('day_of_week', selectedDay)
      .order('start_time', { ascending: true });
    setSchedules(data ?? []);
  }, [user, selectedDay]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchSchedules);
    return unsub;
  }, [navigation, fetchSchedules]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedules();
    setRefreshing(false);
  };

  const deleteSchedule = (id) => {
    Alert.alert('Delete Schedule', 'Remove this class from schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('class_schedules').delete().eq('id', id);
          fetchSchedules();
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <Card
      onPress={() => navigation.navigate('AddSchedule', { schedule: item })}
      style={{ borderLeftWidth: 4, borderLeftColor: item.subjects?.color || COLORS.primary }}
    >
      <View style={styles.scheduleRow}>
        <View style={styles.timeCol}>
          <Text style={styles.timeText}>{item.start_time?.slice(0, 5)}</Text>
          <Text style={styles.timeDivider}>–</Text>
          <Text style={styles.timeText}>{item.end_time?.slice(0, 5)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.subjectName}>{item.subjects?.name}</Text>
          {item.subjects?.code && <Text style={styles.subjectCode}>{item.subjects.code}</Text>}
          {item.room && <Text style={styles.detail}>📍 {item.room}</Text>}
          {item.instructor && <Text style={styles.detail}>👤 {item.instructor}</Text>}
        </View>
        <TouchableOpacity onPress={() => deleteSchedule(item.id)}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Day Selector */}
      <View style={styles.dayRow}>
        {DAYS_OF_WEEK.map((day, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setSelectedDay(idx)}
            style={[styles.dayChip, selectedDay === idx && styles.dayActive]}
          >
            <Text style={[styles.dayText, selectedDay === idx && styles.dayTextActive]}>
              {day.slice(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={schedules}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState icon="🗓️" title="No classes" subtitle={`No classes on ${DAYS_OF_WEEK[selectedDay]}`} />}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddSchedule')}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  dayChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  dayActive: { backgroundColor: COLORS.primary },
  dayText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '500' },
  dayTextActive: { color: COLORS.white },
  scheduleRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  timeCol: { alignItems: 'center', minWidth: 50 },
  timeText: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.primary },
  timeDivider: { fontSize: FONTS.sizes.sm, color: COLORS.textLight },
  subjectName: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary },
  subjectCode: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  detail: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});
