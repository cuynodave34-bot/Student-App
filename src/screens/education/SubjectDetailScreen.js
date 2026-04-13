import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { RESOURCE_TYPES } from '../../constants/theme';

export default function SubjectDetailScreen({ route, navigation }) {
  const subject = route.params?.subject;
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [resources, setResources] = useState([]);
  const [targetAvg, setTargetAvg] = useState('90');
  const [remainWeight, setRemainWeight] = useState('1');

  if (!subject) return null;

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [gradesRes, resourcesRes] = await Promise.all([
      supabase.from('grades').select('*').eq('subject_id', subject.id).eq('user_id', user.id).order('date', { ascending: false }).limit(5),
      supabase.from('resources').select('*').eq('subject_id', subject.id).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ]);
    setGrades(gradesRes.data ?? []);
    setResources(resourcesRes.data ?? []);
  }, [user, subject.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchData);
    return unsub;
  }, [navigation, fetchData]);

  // Grade calculations
  const calcAvg = () => {
    if (!grades.length) return 0;
    let ws = 0, tw = 0;
    grades.forEach((g) => {
      const pct = (Number(g.score) / Number(g.max_score)) * 100;
      const w = Number(g.weight) || 1;
      ws += pct * w;
      tw += w;
    });
    return tw > 0 ? ws / tw : 0;
  };

  const currentAvg = calcAvg();
  const currentTotalWeight = grades.reduce((s, g) => s + (Number(g.weight) || 1), 0);

  // "What grade do I need?" calculator
  const calcNeeded = () => {
    const target = Number(targetAvg);
    const rw = Number(remainWeight);
    if (!target || !rw || rw <= 0) return null;
    const needed = (target * (currentTotalWeight + rw) - currentAvg * currentTotalWeight) / rw;
    return needed;
  };
  const neededScore = calcNeeded();

  const getTypeIcon = (type) => {
    const found = RESOURCE_TYPES.find((r) => r.key === type);
    return found?.icon || 'link-outline';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { backgroundColor: subject.color || COLORS.primary }]}>
          <Text style={styles.name}>{subject.name}</Text>
          {subject.code && <Text style={styles.code}>{subject.code}</Text>}
        </View>

        <Card title="Details" icon="information-circle-outline">
          <DetailRow label="Instructor" value={subject.instructor} />
          <DetailRow label="Semester" value={subject.semester} />
          <DetailRow label="Room" value={subject.room} />
          <DetailRow label="Meeting Link" value={subject.meeting_link} />
          <DetailRow label="Status" value={subject.status} />
        </Card>

        {/* Grades Section */}
        <Card
          title="Grades"
          icon="school-outline"
          iconColor={COLORS.primary}
          rightAction={
            <TouchableOpacity onPress={() => navigation.navigate('AddGrade', { prefillSubject: subject.id })}>
              <Text style={styles.actionLink}>+ Add</Text>
            </TouchableOpacity>
          }
        >
          {grades.length > 0 ? (
            <>
              {/* Current average */}
              <View style={styles.avgRow}>
                <Text style={styles.avgLabel}>Average</Text>
                <Text style={[
                  styles.avgValue,
                  { color: currentAvg >= 90 ? COLORS.success : currentAvg >= 75 ? COLORS.warning : COLORS.danger }
                ]}>
                  {currentAvg.toFixed(1)}%
                </Text>
              </View>

              {grades.map((g) => {
                const pct = ((Number(g.score) / Number(g.max_score)) * 100).toFixed(1);
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={styles.gradeRow}
                    onPress={() => navigation.navigate('AddGrade', { grade: g })}
                  >
                    <View style={styles.gradeLeft}>
                      <Text style={styles.gradeType}>{g.grade_type?.toUpperCase()}</Text>
                      <Text style={styles.gradeTitle} numberOfLines={1}>{g.title}</Text>
                    </View>
                    <Text style={[styles.gradeScore, {
                      color: pct >= 90 ? COLORS.success : pct >= 75 ? COLORS.warning : COLORS.danger
                    }]}>
                      {g.score}/{g.max_score} ({pct}%)
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                onPress={() => navigation.navigate('EducationTabs', { screen: 'Grades' })}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>View All Grades →</Text>
              </TouchableOpacity>

              {/* What grade do I need? */}
              <View style={styles.calcSection}>
                <Text style={styles.calcTitle}>What grade do I need?</Text>
                <View style={styles.calcRow}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Target Avg %"
                      value={targetAvg}
                      onChangeText={setTargetAvg}
                      placeholder="90"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Remaining Weight"
                      value={remainWeight}
                      onChangeText={setRemainWeight}
                      placeholder="1"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                {neededScore !== null && (
                  <View style={styles.calcResult}>
                    <Text style={styles.calcResultLabel}>You need at least:</Text>
                    <Text style={[
                      styles.calcResultValue,
                      { color: neededScore > 100 ? COLORS.danger : neededScore <= 0 ? COLORS.success : COLORS.warning }
                    ]}>
                      {neededScore <= 0 ? 'Already achieved! 🎉' : neededScore > 100 ? `${neededScore.toFixed(1)}% (impossible 😢)` : `${neededScore.toFixed(1)}%`}
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="school-outline" size={28} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No grades recorded yet</Text>
              <Button
                title="Add First Grade"
                variant="outline"
                size="sm"
                onPress={() => navigation.navigate('AddGrade', { prefillSubject: subject.id })}
                style={{ marginTop: SPACING.sm }}
              />
            </View>
          )}
        </Card>

        {/* Resources Section */}
        <Card
          title="Resources"
          icon="bookmark-outline"
          iconColor={COLORS.accent}
          rightAction={
            <TouchableOpacity onPress={() => navigation.navigate('AddResource', { prefillSubject: subject.id })}>
              <Text style={styles.actionLink}>+ Add</Text>
            </TouchableOpacity>
          }
        >
          {resources.length > 0 ? (
            <>
              {resources.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.resourceRow}
                  onPress={() => r.url && Linking.openURL(r.url).catch(() => Alert.alert('Error', 'Cannot open URL'))}
                >
                  <Ionicons name={getTypeIcon(r.resource_type)} size={18} color={COLORS.primary} />
                  <Text style={styles.resourceTitle} numberOfLines={1}>{r.title}</Text>
                  <Ionicons name="open-outline" size={14} color={COLORS.textLight} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => navigation.navigate('EducationTabs', { screen: 'Resources' })}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>View All Resources →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="bookmark-outline" size={28} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No resources saved yet</Text>
              <Button
                title="Add Resource"
                variant="outline"
                size="sm"
                onPress={() => navigation.navigate('AddResource', { prefillSubject: subject.id })}
                style={{ marginTop: SPACING.sm }}
              />
            </View>
          )}
        </Card>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  header: {
    padding: SPACING.xxl,
    borderRadius: 16,
    marginBottom: SPACING.lg,
  },
  name: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.white },
  code: { fontSize: FONTS.sizes.lg, color: 'rgba(255,255,255,0.8)', marginTop: SPACING.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  detailValue: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, fontWeight: '500', textTransform: 'capitalize' },
  actionLink: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  // Grades
  avgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avgLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  avgValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.border}60`,
  },
  gradeLeft: { flex: 1 },
  gradeType: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, fontWeight: '600' },
  gradeTitle: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, marginTop: 2 },
  gradeScore: { fontSize: FONTS.sizes.md, fontWeight: '600', marginLeft: SPACING.sm },
  viewAllBtn: { paddingVertical: SPACING.md, alignItems: 'center' },
  viewAllText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  // Calculator
  calcSection: {
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  calcTitle: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  calcRow: { flexDirection: 'row', gap: SPACING.md },
  calcResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  calcResultLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  calcResultValue: { fontSize: FONTS.sizes.lg, fontWeight: '700' },
  // Resources
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.border}60`,
  },
  resourceTitle: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  // Empty
  emptySection: { alignItems: 'center', paddingVertical: SPACING.lg },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textLight, marginTop: SPACING.sm },
});
