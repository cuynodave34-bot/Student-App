import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const GRADE_POINTS = [
  { label: '1.00', value: 4.0 },
  { label: '1.25', value: 3.75 },
  { label: '1.50', value: 3.5 },
  { label: '1.75', value: 3.25 },
  { label: '2.00', value: 3.0 },
  { label: '2.25', value: 2.75 },
  { label: '2.50', value: 2.5 },
  { label: '2.75', value: 2.25 },
  { label: '3.00', value: 2.0 },
  { label: '5.00', value: 0.0 },
];

export default function GPACalculatorScreen() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('subjects').select('id, name, credit_units').eq('user_id', user.id).order('name')
      .then(({ data }) => {
        const subs = data ?? [];
        setSubjects(subs);
        setEntries(subs.map((s) => ({ subjectId: s.id, name: s.name, units: s.credit_units || 3, grade: '' })));
      });
  }, [user]);

  const updateEntry = (idx, field, value) => {
    setEntries((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const addManualEntry = () => {
    setEntries((prev) => [...prev, { subjectId: null, name: '', units: 3, grade: '' }]);
  };

  const removeEntry = (idx) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const validEntries = entries.filter((e) => e.grade !== '' && e.units > 0);
  const totalUnits = validEntries.reduce((s, e) => s + Number(e.units), 0);
  const weightedSum = validEntries.reduce((s, e) => {
    const gp = GRADE_POINTS.find((g) => g.label === e.grade);
    return s + (gp ? gp.value : 0) * Number(e.units);
  }, 0);
  const gpa = totalUnits > 0 ? (weightedSum / totalUnits).toFixed(2) : '—';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>GPA Calculator</Text>

        {/* GPA Result */}
        <Card style={styles.resultCard}>
          <Text style={styles.resultLabel}>Estimated GPA</Text>
          <Text style={styles.resultGPA}>{gpa}</Text>
          <Text style={styles.resultUnits}>{totalUnits} total units</Text>
        </Card>

        {/* Entries */}
        {entries.map((entry, idx) => (
          <View key={idx} style={styles.entryRow}>
            <View style={styles.entryLeft}>
              <TextInput
                style={styles.nameInput}
                value={entry.name}
                onChangeText={(v) => updateEntry(idx, 'name', v)}
                placeholder="Subject"
                placeholderTextColor={COLORS.textLight}
              />
              <TextInput
                style={styles.unitsInput}
                value={String(entry.units)}
                onChangeText={(v) => updateEntry(idx, 'units', v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="Units"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeScroll}>
              {GRADE_POINTS.map((g) => (
                <TouchableOpacity
                  key={g.label}
                  onPress={() => updateEntry(idx, 'grade', entry.grade === g.label ? '' : g.label)}
                  style={[styles.gradeChip, entry.grade === g.label && styles.gradeChipActive]}
                >
                  <Text style={[styles.gradeText, entry.grade === g.label && styles.gradeTextActive]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => removeEntry(idx)} style={styles.removeBtn}>
              <Ionicons name="close-circle" size={22} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addManualEntry}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.addText}>Add Subject</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xxl, paddingBottom: 100 },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xl },
  resultCard: { alignItems: 'center', paddingVertical: SPACING.xxl, marginBottom: SPACING.xl },
  resultLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  resultGPA: { fontSize: 48, fontWeight: '700', color: COLORS.primary, marginVertical: SPACING.sm },
  resultUnits: { fontSize: FONTS.sizes.sm, color: COLORS.textLight },
  entryRow: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  entryLeft: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  nameInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  unitsInput: {
    width: 60,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  gradeScroll: { marginBottom: SPACING.xs },
  gradeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
  },
  gradeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  gradeText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  gradeTextActive: { color: COLORS.white, fontWeight: '600' },
  removeBtn: { position: 'absolute', top: SPACING.sm, right: SPACING.sm },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  addText: { fontSize: FONTS.sizes.md, color: COLORS.primary, fontWeight: '600' },
});
