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

export default function SubjectsScreen({ navigation }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const fetchSubjects = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    setSubjects(data ?? []);
  }, [user]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchSubjects);
    return unsubscribe;
  }, [navigation, fetchSubjects]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubjects();
    setRefreshing(false);
  };

  const deleteSubject = (id) => {
    Alert.alert('Delete Subject', 'This will also delete related schedules. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('subjects').delete().eq('id', id);
          fetchSubjects();
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <Card
      onPress={() => navigation.navigate('SubjectDetail', { subject: item })}
      style={{ borderLeftWidth: 4, borderLeftColor: item.color || COLORS.primary }}
    >
      <View style={styles.subjectRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subjectName}>{item.name}</Text>
          {item.code && <Text style={styles.subjectCode}>{item.code}</Text>}
          {item.instructor && (
            <Text style={styles.subjectDetail}>
              <Ionicons name="person-outline" size={12} /> {item.instructor}
            </Text>
          )}
          {item.semester && (
            <Text style={styles.subjectDetail}>{item.semester}</Text>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => navigation.navigate('AddSubject', { subject: item })}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteSubject(item.id)}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search subjects..." />
      <View style={styles.filterRow}>
        {['active', 'completed', 'dropped', 'all'].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setStatusFilter(f)}
            style={[styles.filterChip, statusFilter === f && styles.filterActive]}
          >
            <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={subjects.filter(s => {
          const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.code && s.code.toLowerCase().includes(search.toLowerCase()));
          const matchStatus = statusFilter === 'all' || s.status === statusFilter;
          return matchSearch && matchStatus;
        })}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="📚"
            title="No subjects yet"
            subtitle="Add your enrolled subjects to organize schedules, tasks, and notes by class."
            actionLabel="Add Subject"
            actionIcon="add-circle-outline"
            onAction={() => navigation.navigate('AddSubject')}
          />
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddSubject')}
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
    flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  filterTextActive: { color: COLORS.white },
  subjectRow: { flexDirection: 'row', alignItems: 'flex-start' },
  subjectName: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary },
  subjectCode: { fontSize: FONTS.sizes.sm, color: COLORS.primary, marginTop: 2 },
  subjectDetail: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: SPACING.md },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  statusText: { fontSize: FONTS.sizes.xs, color: COLORS.primary, textTransform: 'capitalize' },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
