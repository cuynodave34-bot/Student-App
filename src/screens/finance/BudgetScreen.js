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
import Input from '../../components/Input';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS, EXPENSE_CATEGORIES } from '../../constants/theme';

export default function BudgetScreen({ navigation }) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [spending, setSpending] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`;

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [budgetRes, txRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', month).eq('year', year),
      supabase.from('transactions').select('category, amount').eq('user_id', user.id).eq('type', 'expense')
        .gte('transaction_date', monthStart).lte('transaction_date', monthEnd),
    ]);

    setBudgets(budgetRes.data ?? []);

    const spendMap = {};
    (txRes.data ?? []).forEach((t) => {
      spendMap[t.category] = (spendMap[t.category] || 0) + Number(t.amount);
    });
    setSpending(spendMap);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchData);
    return unsub;
  }, [navigation, fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const addBudget = async () => {
    if (!newCategory || !newAmount || isNaN(Number(newAmount))) {
      Alert.alert('Validation', 'Select category and enter a valid amount');
      return;
    }
    const { error } = await supabase.from('budgets').upsert({
      user_id: user.id,
      category: newCategory,
      planned_amount: Number(newAmount),
      month,
      year,
    }, { onConflict: 'user_id,category,month,year' });

    if (error) Alert.alert('Error', error.message);
    else { setShowAdd(false); setNewCategory(''); setNewAmount(''); fetchData(); }
  };

  const deleteBudget = (id) => {
    Alert.alert('Delete Budget', 'Remove this budget category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await supabase.from('budgets').delete().eq('id', id); fetchData(); },
      },
    ]);
  };

  const fmt = (n) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const totalPlanned = budgets.reduce((s, b) => s + Number(b.planned_amount), 0);
  const totalSpent = Object.values(spending).reduce((s, v) => s + v, 0);

  const renderItem = ({ item }) => {
    const spent = spending[item.category] || 0;
    const pct = item.planned_amount > 0 ? Math.min((spent / Number(item.planned_amount)) * 100, 100) : 0;
    const overBudget = spent > Number(item.planned_amount);

    return (
      <Card>
        <View style={styles.budgetRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.catName}>{item.category}</Text>
            <Text style={styles.budgetDetail}>
              {fmt(spent)} / {fmt(item.planned_amount)}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${pct}%`, backgroundColor: overBudget ? COLORS.danger : COLORS.primary },
                ]}
              />
            </View>
          </View>
          <TouchableOpacity onPress={() => deleteBudget(item.id)}>
            <Ionicons name="close-circle-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Budget</Text>
          <Text style={styles.summaryValue}>{fmt(totalPlanned)}</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={[styles.summaryValue, { color: COLORS.expense }]}>{fmt(totalSpent)}</Text>
        </View>
      </View>

      <FlatList
        data={budgets}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="📊"
            title="No budgets set"
            subtitle="Set monthly spending limits per category to keep your finances in check."
            actionLabel="Set Budget"
            actionIcon="add-circle-outline"
            onAction={() => setShowAdd(true)}
          />
        }
        ListFooterComponent={
          showAdd ? (
            <Card>
              <Text style={styles.addTitle}>Add Budget Category</Text>
              <View style={styles.chipRow}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => setNewCategory(c.key)}
                    style={[styles.chip, newCategory === c.key && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, newCategory === c.key && styles.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input label="Planned Amount (₱)" value={newAmount} onChangeText={setNewAmount} placeholder="0.00" keyboardType="decimal-pad" icon="cash-outline" />
              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                <Button title="Cancel" variant="outline" onPress={() => setShowAdd(false)} style={{ flex: 1 }} />
                <Button title="Save" onPress={addBudget} style={{ flex: 1 }} />
              </View>
            </Card>
          ) : null
        }
      />
      {!showAdd && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  summary: {
    flexDirection: 'row', backgroundColor: COLORS.surface, padding: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  catName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary, textTransform: 'capitalize' },
  budgetDetail: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginVertical: SPACING.xs },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  addTitle: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});
