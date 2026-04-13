import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { TASK_TYPES, PRIORITY_LEVELS } from '../../constants/theme';
import { useNotifications } from '../../contexts/NotificationContext';

export default function AddTaskScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.task;
  const { scheduleNotification, cancelNotification } = useNotifications();

  const [title, setTitle] = useState(editing?.title || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [subjectId, setSubjectId] = useState(editing?.subject_id || null);
  const [taskType, setTaskType] = useState(editing?.task_type || 'assignment');
  const [dueDate, setDueDate] = useState(editing?.due_date || new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState(editing?.due_time?.slice(0, 5) || '');
  const [priority, setPriority] = useState(editing?.priority || 'medium');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('subjects').select('id, name, color').eq('user_id', user.id).order('name')
      .then(({ data }) => setSubjects(data ?? []));
    // Load existing subtasks when editing
    if (editing) {
      supabase.from('task_subtasks').select('*').eq('task_id', editing.id).order('sort_order')
        .then(({ data }) => setSubtasks(data ?? []));
    }
  }, [user]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Task title is required');
      return;
    }
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      Alert.alert('Validation', 'Date must be in YYYY-MM-DD format');
      return;
    }
    if (dueTime && !/^\d{2}:\d{2}$/.test(dueTime)) {
      Alert.alert('Validation', 'Time must be in HH:MM format');
      return;
    }
    setLoading(true);

    const payload = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      subject_id: subjectId,
      task_type: taskType,
      due_date: dueDate || null,
      due_time: dueTime ? `${dueTime}:00` : null,
      priority,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('tasks').update(payload).eq('id', editing.id));
      if (!error) {
        // Sync subtasks: delete old, insert current
        await supabase.from('task_subtasks').delete().eq('task_id', editing.id);
        if (subtasks.length > 0) {
          await supabase.from('task_subtasks').insert(
            subtasks.map((s, i) => ({
              task_id: editing.id,
              user_id: user.id,
              title: s.title,
              is_done: s.is_done || false,
              sort_order: i,
            }))
          );
        }
      }
    } else {
      const { data: newTask, error: insertError } = await supabase.from('tasks').insert(payload).select().single();
      error = insertError;
      if (!error && newTask && subtasks.length > 0) {
        await supabase.from('task_subtasks').insert(
          subtasks.map((s, i) => ({
            task_id: newTask.id,
            user_id: user.id,
            title: s.title,
            is_done: false,
            sort_order: i,
          }))
        );
      }
    }

    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else {
      // Schedule notification
      if (editing) await cancelNotification(`task_${editing.id}`);
      if (dueDate) {
        const taskId = editing?.id || Date.now();
        const triggerTime = dueTime
          ? new Date(`${dueDate}T${dueTime}:00`)
          : new Date(`${dueDate}T09:00:00`);
        triggerTime.setHours(triggerTime.getHours() - 1);
        const subjectName = subjects.find(s => s.id === subjectId)?.name;
        await scheduleNotification(
          `task_${taskId}`,
          `\ud83d\udccb Task Due: ${title.trim()}`,
          subjectName ? `${subjectName} \u2014 ${priority} priority` : `${priority} priority`,
          triggerTime
        );
      }
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{editing ? 'Edit Task' : 'Add Task'}</Text>

          <Input label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Submit Lab Report" icon="document-text-outline" autoCapitalize="sentences" />
          <Input label="Description" value={description} onChangeText={setDescription} placeholder="Optional notes..." multiline numberOfLines={3} icon="chatbox-outline" autoCapitalize="sentences" />

          {/* Subtasks / Checklist */}
          <Text style={styles.label}>Checklist</Text>
          {subtasks.map((sub, index) => (
            <View key={index} style={styles.subtaskRow}>
              <TouchableOpacity onPress={() => {
                const updated = [...subtasks];
                updated[index] = { ...sub, is_done: !sub.is_done };
                setSubtasks(updated);
              }}>
                <Ionicons
                  name={sub.is_done ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={sub.is_done ? COLORS.success : COLORS.textLight}
                />
              </TouchableOpacity>
              <Text style={[styles.subtaskText, sub.is_done && styles.subtaskDone]} numberOfLines={1}>{sub.title}</Text>
              <TouchableOpacity onPress={() => setSubtasks(subtasks.filter((_, i) => i !== index))}>
                <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.subtaskInputRow}>
            <TextInput
              style={styles.subtaskInput}
              value={newSubtask}
              onChangeText={setNewSubtask}
              placeholder="Add checklist item..."
              placeholderTextColor={COLORS.textLight}
              onSubmitEditing={() => {
                if (newSubtask.trim()) {
                  setSubtasks([...subtasks, { title: newSubtask.trim(), is_done: false }]);
                  setNewSubtask('');
                }
              }}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={() => {
                if (newSubtask.trim()) {
                  setSubtasks([...subtasks, { title: newSubtask.trim(), is_done: false }]);
                  setNewSubtask('');
                }
              }}
              style={styles.subtaskAddBtn}
            >
              <Ionicons name="add-circle" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Subject picker */}
          <Text style={styles.label}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              onPress={() => setSubjectId(null)}
              style={[styles.chip, !subjectId && styles.chipActive]}
            >
              <Text style={[styles.chipText, !subjectId && styles.chipTextActive]}>None</Text>
            </TouchableOpacity>
            {subjects.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSubjectId(s.id)}
                style={[styles.chip, subjectId === s.id && { backgroundColor: s.color, borderColor: s.color }]}
              >
                <Text style={[styles.chipText, subjectId === s.id && { color: COLORS.white }]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Task Type */}
          <Text style={styles.label}>Task Type</Text>
          <View style={styles.chipRow}>
            {TASK_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTaskType(t.key)}
                style={[styles.chip, taskType === t.key && styles.chipActive]}
              >
                <Text style={[styles.chipText, taskType === t.key && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority */}
          <Text style={styles.label}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITY_LEVELS.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPriority(p.key)}
                style={[styles.chip, priority === p.key && { backgroundColor: p.color, borderColor: p.color }]}
              >
                <Text style={[styles.chipText, priority === p.key && { color: COLORS.white }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Due Date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" icon="calendar-outline" />
          <Input label="Due Time" value={dueTime} onChangeText={setDueTime} placeholder="HH:MM (24h)" icon="time-outline" />

          <Button
            title={editing ? 'Update Task' : 'Add Task'}
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={{ marginTop: SPACING.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xxl },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xl },
  label: { fontSize: FONTS.sizes.md, fontWeight: '500', color: COLORS.textPrimary, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  chipScroll: { marginBottom: SPACING.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  subtaskRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  subtaskText: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  subtaskDone: { textDecorationLine: 'line-through', color: COLORS.textLight },
  subtaskInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg,
  },
  subtaskInput: {
    flex: 1, fontSize: FONTS.sizes.md, color: COLORS.textPrimary,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: SPACING.sm,
  },
  subtaskAddBtn: { padding: SPACING.xs },
});
