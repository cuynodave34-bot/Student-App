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
import { GRADE_TYPES } from '../../constants/theme';

export default function AddGradeScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.grade;
  const prefillSubject = route.params?.prefillSubject;

  const [title, setTitle] = useState(editing?.title || '');
  const [gradeType, setGradeType] = useState(editing?.grade_type || 'assignment');
  const [subjectId, setSubjectId] = useState(editing?.subject_id || prefillSubject || null);
  const [score, setScore] = useState(editing?.score != null ? String(editing.score) : '');
  const [maxScore, setMaxScore] = useState(editing?.max_score != null ? String(editing.max_score) : '100');
  const [weight, setWeight] = useState(editing?.weight != null ? String(editing.weight) : '1');
  const [date, setDate] = useState(editing?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(editing?.notes || '');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('subjects').select('id, name, color').eq('user_id', user.id).eq('status', 'active').order('name')
      .then(({ data }) => setSubjects(data ?? []));
  }, [user]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }
    if (!subjectId) {
      Alert.alert('Validation', 'Please select a subject');
      return;
    }
    const scoreNum = Number(score);
    const maxNum = Number(maxScore);
    const weightNum = Number(weight);

    if (isNaN(scoreNum) || scoreNum < 0) {
      Alert.alert('Validation', 'Score must be a non-negative number');
      return;
    }
    if (isNaN(maxNum) || maxNum <= 0) {
      Alert.alert('Validation', 'Max score must be greater than 0');
      return;
    }
    if (scoreNum > maxNum) {
      Alert.alert('Validation', 'Score cannot exceed max score');
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Validation', 'Weight must be greater than 0');
      return;
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Validation', 'Date must be in YYYY-MM-DD format');
      return;
    }

    setLoading(true);
    const payload = {
      user_id: user.id,
      subject_id: subjectId,
      title: title.trim(),
      grade_type: gradeType,
      score: scoreNum,
      max_score: maxNum,
      weight: weightNum,
      date: date || null,
      notes: notes.trim() || null,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('grades').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('grades').insert(payload));
    }

    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else navigation.goBack();
  };

  const pctPreview = score && maxScore && Number(maxScore) > 0
    ? ((Number(score) / Number(maxScore)) * 100).toFixed(1)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{editing ? 'Edit Grade' : 'Add Grade'}</Text>

          <Input label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Midterm Exam" icon="document-text-outline" autoCapitalize="sentences" />

          {/* Grade Type */}
          <Text style={styles.label}>Grade Type</Text>
          <View style={styles.chipRow}>
            {GRADE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setGradeType(t.key)}
                style={[styles.chip, gradeType === t.key && styles.chipActive]}
              >
                <Text style={[styles.chipText, gradeType === t.key && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

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

          {/* Score inputs */}
          <View style={styles.scoreRow}>
            <View style={{ flex: 1 }}>
              <Input label="Score *" value={score} onChangeText={setScore} placeholder="0" icon="create-outline" keyboardType="decimal-pad" />
            </View>
            <Text style={styles.divider}>/</Text>
            <View style={{ flex: 1 }}>
              <Input label="Max Score *" value={maxScore} onChangeText={setMaxScore} placeholder="100" icon="analytics-outline" keyboardType="decimal-pad" />
            </View>
          </View>

          {/* Percentage preview */}
          {pctPreview && (
            <View style={styles.pctPreview}>
              <Text style={styles.pctLabel}>Percentage:</Text>
              <Text style={[
                styles.pctValue,
                { color: pctPreview >= 90 ? COLORS.success : pctPreview >= 75 ? COLORS.warning : COLORS.danger }
              ]}>
                {pctPreview}%
              </Text>
            </View>
          )}

          <Input label="Weight" value={weight} onChangeText={setWeight} placeholder="1.0" icon="balance-outline" keyboardType="decimal-pad" />
          <Input label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" icon="calendar-outline" />
          <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional notes..." icon="chatbox-outline" multiline numberOfLines={2} />

          <Button
            title={editing ? 'Update Grade' : 'Add Grade'}
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
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  divider: { fontSize: FONTS.sizes.xxl, color: COLORS.textLight, marginTop: SPACING.lg },
  pctPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pctLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  pctValue: { fontSize: FONTS.sizes.xl, fontWeight: '700' },
});
