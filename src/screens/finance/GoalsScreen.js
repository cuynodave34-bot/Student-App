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

export default function GoalsScreen({ navigation }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setGoals(data ?? []);
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchGoals);
    return unsub;
  }, [navigation, fetchGoals]);

  const onRefresh = async () => { setRefreshing(true); await fetchGoals(); setRefreshing(false); };

  const deleteGoal = (id) => {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('savings_goals').delete().eq('id', id); fetchGoals(); } },
    ]);
  };

  const fmt = (n) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const renderItem = ({ item }) => {
    const pct = item.target_amount > 0
      ? Math.min((Number(item.current_amount) / Number(item.target_amount)) * 100, 100) : 0;

    return (
      <Card onPress={() => navigation.navigate('AddGoal', { goal: item })}>
        <View style={styles.goalRow}>
          <Text style={styles.goalIcon}>{item.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalName}>{item.name}</Text>
            <Text style={styles.goalAmount}>
              {fmt(item.current_amount)} / {fmt(item.target_amount)}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <View style={styles.goalMeta}>
              <Text style={styles.pctText}>{pct.toFixed(1)}%</Text>
              {item.deadline && <Text style={styles.deadline}>Due: {item.deadline}</Text>}
            </View>
          </View>
          <TouchableOpacity onPress={() => deleteGoal(item.id)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={goals}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="🎯"
            title="No savings goals yet"
            subtitle="Set a goal to save for something important — a new laptop, a trip, or tuition."
            actionLabel="Create Goal"
            actionIcon="add-circle-outline"
            onAction={() => navigation.navigate('AddGoal')}
          />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddGoal')}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  goalRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  goalIcon: { fontSize: 32 },
  goalName: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary },
  goalAmount: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginVertical: SPACING.xs },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  pctText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.accent },
  deadline: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});
