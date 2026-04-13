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
import SearchBar from '../../components/SearchBar';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

const FILTERS = ['all', 'pending', 'in_progress', 'done', 'overdue'];

export default function TasksScreen({ navigation }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from('tasks')
      .select('*, subjects(name, color), task_subtasks(id, is_done)')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    const { data } = await query;
    setTasks(data ?? []);
  }, [user, filter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchTasks);
    return unsub;
  }, [navigation, fetchTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const toggleDone = async (task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    fetchTasks();
  };

  const deleteTask = (id) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('tasks').delete().eq('id', id);
          fetchTasks();
        },
      },
    ]);
  };

  const getPriorityColor = (p) =>
    ({ low: COLORS.priorityLow, medium: COLORS.priorityMedium, high: COLORS.priorityHigh, urgent: COLORS.priorityUrgent }[p] || COLORS.textLight);

  const renderItem = ({ item }) => (
    <Card onPress={() => navigation.navigate('AddTask', { task: item })}>
      <View style={styles.taskRow}>
        <TouchableOpacity onPress={() => toggleDone(item)} style={styles.checkbox}>
          <Ionicons
            name={item.status === 'done' ? 'checkbox' : 'square-outline'}
            size={24}
            color={item.status === 'done' ? COLORS.success : COLORS.textLight}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.taskTitle,
              item.status === 'done' && styles.taskDone,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            {item.subjects && (
              <View style={[styles.tag, { backgroundColor: `${item.subjects.color}20` }]}>
                <Text style={[styles.tagText, { color: item.subjects.color }]}>{item.subjects.name}</Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: `${getPriorityColor(item.priority)}20` }]}>
              <Text style={[styles.tagText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
            </View>
            <Text style={styles.taskType}>{item.task_type}</Text>
          </View>
          {item.due_date && (
            <Text style={styles.dueDate}>
              Due: {item.due_date}{item.due_time ? ` at ${item.due_time.slice(0, 5)}` : ''}
            </Text>
          )}
          {item.task_subtasks && item.task_subtasks.length > 0 && (
            <View style={styles.subtaskProgress}>
              <Ionicons name="list-outline" size={12} color={COLORS.textLight} />
              <Text style={styles.subtaskProgressText}>
                {item.task_subtasks.filter(s => s.is_done).length}/{item.task_subtasks.length}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => deleteTask(item.id)}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search tasks..." />
      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tasks.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="✅"
            title="No tasks yet"
            subtitle="Add your first assignment or project deadline to stay on track."
            actionLabel="Add Task"
            actionIcon="add-circle-outline"
            onAction={() => navigation.navigate('AddTask')}
          />
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTask')}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  filterTextActive: { color: COLORS.white },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  checkbox: { marginTop: 2 },
  taskTitle: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary },
  taskDone: { textDecorationLine: 'line-through', color: COLORS.textLight },
  metaRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs, flexWrap: 'wrap' },
  tag: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
  tagText: { fontSize: FONTS.sizes.xs, fontWeight: '500', textTransform: 'capitalize' },
  taskType: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, textTransform: 'capitalize', alignSelf: 'center' },
  dueDate: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  subtaskProgress: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.xs },
  subtaskProgressText: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});
