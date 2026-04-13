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
import { EVENT_TYPES, REMINDER_PRESETS } from '../../constants/theme';
import { useNotifications } from '../../contexts/NotificationContext';

export default function AddAcademicEventScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.event;
  const { scheduleNotification, cancelNotification } = useNotifications();

  const [title, setTitle] = useState(editing?.title || '');
  const [eventType, setEventType] = useState(editing?.event_type || 'quiz');
  const [subjectId, setSubjectId] = useState(editing?.subject_id || null);
  const [eventDate, setEventDate] = useState(editing?.event_date || '');
  const [eventTime, setEventTime] = useState(editing?.event_time?.slice(0, 5) || '');
  const [location, setLocation] = useState(editing?.location || '');
  const [coverage, setCoverage] = useState(editing?.coverage || '');
  const [notes, setNotes] = useState(editing?.notes || '');
  const [reminderMinutes, setReminderMinutes] = useState(String(editing?.reminder_minutes ?? 60));
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('subjects').select('id, name, color').eq('user_id', user.id).order('name')
      .then(({ data }) => setSubjects(data ?? []));
  }, [user]);

  const handleSave = async () => {
    if (!title.trim() || !eventDate) {
      Alert.alert('Validation', 'Title and date are required');
      return;
    }
    setLoading(true);

    const payload = {
      user_id: user.id,
      title: title.trim(),
      event_type: eventType,
      subject_id: subjectId,
      event_date: eventDate,
      event_time: eventTime ? `${eventTime}:00` : null,
      location: location.trim() || null,
      coverage: coverage.trim() || null,
      notes: notes.trim() || null,
      reminder_minutes: parseInt(reminderMinutes) || 60,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('academic_events').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('academic_events').insert(payload));
    }

    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else {
      // Schedule notification
      const entityId = editing ? editing.id : payload.title;
      if (editing) await cancelNotification(`event_${editing.id}`);
      if (eventDate) {
        const baseTime = eventTime
          ? new Date(`${eventDate}T${eventTime}:00`)
          : new Date(`${eventDate}T08:00:00`);
        baseTime.setMinutes(baseTime.getMinutes() - (parseInt(reminderMinutes) || 60));
        const subjectName = subjects.find(s => s.id === subjectId)?.name;
        await scheduleNotification(
          `event_${editing?.id || Date.now()}`,
          `📚 ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}: ${title.trim()}`,
          subjectName ? `${subjectName}` : 'Upcoming event',
          baseTime
        );
      }
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{editing ? 'Edit Event' : 'Add Academic Event'}</Text>

          <Input label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Midterm Exam" icon="document-text-outline" autoCapitalize="sentences" />

          {/* Event Type */}
          <Text style={styles.label}>Event Type</Text>
          <View style={styles.chipRow}>
            {EVENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setEventType(t.key)}
                style={[styles.chip, eventType === t.key && styles.chipActive]}
              >
                <Text style={[styles.chipText, eventType === t.key && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Subject */}
          <Text style={styles.label}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity onPress={() => setSubjectId(null)} style={[styles.chip, !subjectId && styles.chipActive]}>
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

          <Input label="Event Date *" value={eventDate} onChangeText={setEventDate} placeholder="YYYY-MM-DD" icon="calendar-outline" />
          <Input label="Event Time" value={eventTime} onChangeText={setEventTime} placeholder="HH:MM (24h)" icon="time-outline" />
          <Input label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Room 101" icon="location-outline" />
          <Input label="Coverage / Topics" value={coverage} onChangeText={setCoverage} placeholder="Chapters 1-5" icon="list-outline" multiline numberOfLines={2} />
          <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Additional notes..." icon="chatbox-outline" multiline numberOfLines={2} />

          {/* Reminder Presets */}
          <Text style={styles.label}>Remind me</Text>
          <View style={styles.chipRow}>
            {REMINDER_PRESETS.map((r) => (
              <TouchableOpacity
                key={r.key}
                onPress={() => setReminderMinutes(String(r.key))}
                style={[styles.chip, parseInt(reminderMinutes) === r.key && styles.chipActive]}
              >
                <Text style={[styles.chipText, parseInt(reminderMinutes) === r.key && styles.chipTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title={editing ? 'Update Event' : 'Add Event'}
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
