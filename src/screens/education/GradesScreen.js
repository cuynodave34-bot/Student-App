import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import SwipeableRow from '../../components/SwipeableRow';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function GradesScreen({ navigation }) {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterSubject, setFilterSubject] = useState(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGrades = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from('grades')
      .select('*, subjects(name, color)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (filterSubject) query = query.eq('subject_id', filterSubject);

    const { data } = await query;
    setGrades(data ?? []);
    setLoading(false);
  }, [user, filterSubject]);

  const fetchSubjects = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('subjects')
      .select('id, name, color')
      .eq('user_id', user.id)
      .order('name');
    setSubjects(data ?? []);
  }, [user]);

  useEffect(() => {
    fetchGrades();
    fetchSubjects();
  }, [fetchGrades, fetchSubjects]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchGrades);
    return unsub;
  }, [navigation, fetchGrades]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGrades();
    setRefreshing(false);
  };

  const handleDelete = async (id) => {
    await supabase.from('grades').delete().eq('id', id);
    fetchGrades();
  };

  const filtered = grades.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate weighted average
  const calcAvg = (list) => {
    if (!list.length) return 0;
    let weightedSum = 0;
    let totalWeight = 0;
    list.forEach((g) => {
      const pct = (Number(g.score) / Number(g.max_score)) * 100;
      const w = Number(g.weight) || 1;
      weightedSum += pct * w;
      totalWeight += w;
    });
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  const overallAvg = calcAvg(filtered);

  const renderGrade = ({ item }) => {
    const pct = ((Number(item.score) / Number(item.max_score)) * 100).toFixed(1);
    const pctColor = pct >= 90 ? COLORS.success : pct >= 75 ? COLORS.warning : COLORS.danger;

    return (
      <SwipeableRow onDelete={() => handleDelete(item.id)}>
        <TouchableOpacity
          style={styles.gradeCard}
          onPress={() => navigation.navigate('AddGrade', { grade: item })}
          activeOpacity={0.7}
        >
          <View style={[styles.typeBadge, { backgroundColor: `${item.subjects?.color || COLORS.primary}20` }]}>
            <Text style={[styles.typeBadgeText, { color: item.subjects?.color || COLORS.primary }]}>
              {item.grade_type?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.gradeInfo}>
            <Text style={styles.gradeTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.gradeMeta}>
              {item.subjects?.name || 'No subject'}{item.date ? ` · ${item.date}` : ''}
            </Text>
          </View>
          <View style={styles.scoreCol}>
            <Text style={[styles.scorePct, { color: pctColor }]}>{pct}%</Text>
            <Text style={styles.scoreRaw}>{item.score}/{item.max_score}</Text>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>Weighted Average</Text>
          <Text style={[
            styles.summaryValue,
            { color: overallAvg >= 90 ? COLORS.success : overallAvg >= 75 ? COLORS.warning : overallAvg > 0 ? COLORS.danger : COLORS.textLight }
          ]}>
            {filtered.length > 0 ? `${overallAvg.toFixed(1)}%` : '—'}
          </Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryCount}>{filtered.length}</Text>
          <Text style={styles.summaryCountLabel}>grades</Text>
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search grades..." />

      {/* Subject filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        <TouchableOpacity
          onPress={() => setFilterSubject(null)}
          style={[styles.chip, !filterSubject && styles.chipActive]}
        >
          <Text style={[styles.chipText, !filterSubject && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {subjects.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => setFilterSubject(filterSubject === s.id ? null : s.id)}
            style={[styles.chip, filterSubject === s.id && { backgroundColor: s.color, borderColor: s.color }]}
          >
            <Text style={[styles.chipText, filterSubject === s.id && { color: COLORS.white }]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderGrade}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="school-outline"
              title="No Grades Yet"
              message="Track your quiz, exam, and assignment scores"
              actionLabel="Add Grade"
              onAction={() => navigation.navigate('AddGrade')}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: SPACING.lg,
    marginBottom: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLeft: {},
  summaryLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONTS.sizes.xxxl, fontWeight: '800', marginTop: SPACING.xs },
  summaryRight: { alignItems: 'center' },
  summaryCount: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.primary },
  summaryCountLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  chipScroll: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm, maxHeight: 44 },
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
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.md,
  },
  typeBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  gradeInfo: { flex: 1 },
  gradeTitle: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  gradeMeta: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  scoreCol: { alignItems: 'flex-end', marginLeft: SPACING.sm },
  scorePct: { fontSize: FONTS.sizes.lg, fontWeight: '700' },
  scoreRaw: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 2 },
});
