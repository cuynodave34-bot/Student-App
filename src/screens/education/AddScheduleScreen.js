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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { DAYS_OF_WEEK } from '../../constants/theme';

export default function AddScheduleScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.schedule;

  const [subjectId, setSubjectId] = useState(editing?.subject_id || null);
  const [dayOfWeek, setDayOfWeek] = useState(editing?.day_of_week ?? 1);
  const [startTime, setStartTime] = useState(editing?.start_time?.slice(0, 5) || '');
  const [endTime, setEndTime] = useState(editing?.end_time?.slice(0, 5) || '');
  const [room, setRoom] = useState(editing?.room || '');
  const [instructor, setInstructor] = useState(editing?.instructor || '');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('subjects').select('id, name, color').eq('user_id', user.id).order('name')
      .then(({ data }) => setSubjects(data ?? []));
  }, [user]);

  const handleSave = async () => {
    if (!subjectId || !startTime || !endTime) {
      Alert.alert('Validation', 'Subject, start time, and end time are required');
      return;
    }
    setLoading(true);

    const payload = {
      user_id: user.id,
      subject_id: subjectId,
      day_of_week: dayOfWeek,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      room: room.trim() || null,
      instructor: instructor.trim() || null,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('class_schedules').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('class_schedules').insert(payload));
    }

    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{editing ? 'Edit Schedule' : 'Add Class Schedule'}</Text>

          {/* Subject */}
          <Text style={styles.label}>Subject *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
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

          {/* Day */}
          <Text style={styles.label}>Day of Week</Text>
          <View style={styles.chipRow}>
            {DAYS_OF_WEEK.map((d, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setDayOfWeek(idx)}
                style={[styles.chip, dayOfWeek === idx && styles.chipActive]}
              >
                <Text style={[styles.chipText, dayOfWeek === idx && styles.chipTextActive]}>{d.slice(0, 3)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Start Time *" value={startTime} onChangeText={setStartTime} placeholder="HH:MM (24h)" icon="time-outline" />
          <Input label="End Time *" value={endTime} onChangeText={setEndTime} placeholder="HH:MM (24h)" icon="time-outline" />
          <Input label="Room" value={room} onChangeText={setRoom} placeholder="e.g. Room 301" icon="location-outline" />
          <Input label="Instructor" value={instructor} onChangeText={setInstructor} placeholder="e.g. Prof. Santos" icon="person-outline" autoCapitalize="words" />

          <Button
            title={editing ? 'Update Schedule' : 'Add Schedule'}
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
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
});
