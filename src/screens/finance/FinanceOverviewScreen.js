import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/Card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

export default function FinanceOverviewScreen({ navigation }) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [monthIncome, setMonthIncome] = useState(0);
  const [monthExpense, setMonthExpense] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [pendingBills, setPendingBills] = useState(0);
  const [spendingByCategory, setSpendingByCategory] = useState([]);

  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-31`;

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [incomeRes, expenseRes, budgetRes, goalsRes, billsRes, categoryRes] = await Promise.all([
      supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'income')
        .gte('transaction_date', monthStart).lte('transaction_date', monthEnd),
      supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'expense')
        .gte('transaction_date', monthStart).lte('transaction_date', monthEnd),
      supabase.from('budgets').select('planned_amount').eq('user_id', user.id)
        .eq('month', today.getMonth() + 1).eq('year', today.getFullYear()),
      supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('payment_reminders').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('is_paid', false),
      supabase.from('transactions').select('category, amount').eq('user_id', user.id).eq('type', 'expense')
        .gte('transaction_date', monthStart).lte('transaction_date', monthEnd),
    ]);

    setMonthIncome((incomeRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0));
    setMonthExpense((expenseRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0));
    setTotalBudget((budgetRes.data ?? []).reduce((s, b) => s + Number(b.planned_amount), 0));
    setSavingsGoals(goalsRes.data ?? []);
    setPendingBills(billsRes.count ?? 0);

    // Aggregate spending by category
    const catMap = {};
    (categoryRes.data ?? []).forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
    });
    const sorted = Object.entries(catMap)
      .map(([cat, amt]) => ({ category: cat, amount: amt }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
    setSpendingByCategory(sorted);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchData);
    return unsub;
  }, [navigation, fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fmt = (n) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const balance = monthIncome - monthExpense;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>This Month's Balance</Text>
          <Text style={[styles.balanceAmount, { color: balance >= 0 ? COLORS.success : COLORS.danger }]}>
            {fmt(balance)}
          </Text>
          <View style={styles.incExpRow}>
            <View style={styles.incExpCol}>
              <Text style={styles.incExpLabel}>Income</Text>
              <Text style={[styles.incExpValue, { color: COLORS.income }]}>+{fmt(monthIncome)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.incExpCol}>
              <Text style={styles.incExpLabel}>Expenses</Text>
              <Text style={[styles.incExpValue, { color: COLORS.expense }]}>-{fmt(monthExpense)}</Text>
            </View>
          </View>
        </View>

        {/* Budget */}
        <Card
          title="Monthly Budget"
          icon="pie-chart-outline"
          iconColor={COLORS.warning}
          onPress={() => navigation.navigate('Budget')}
        >
          {totalBudget > 0 ? (
            <>
              <Text style={styles.budgetText}>
                {fmt(monthExpense)} spent of {fmt(totalBudget)}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((monthExpense / totalBudget) * 100, 100)}%`,
                      backgroundColor: monthExpense / totalBudget > 0.9 ? COLORS.danger : COLORS.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.remainText}>
                {fmt(Math.max(totalBudget - monthExpense, 0))} remaining
              </Text>
            </>
          ) : (
            <Text style={styles.emptyHint}>No budget set for this month</Text>
          )}
        </Card>

        {/* Spending Breakdown Chart */}
        {spendingByCategory.length > 0 && (
          <Card title="Spending Breakdown" icon="bar-chart-outline" iconColor={COLORS.secondary}>
            {(() => {
              const maxAmt = Math.max(...spendingByCategory.map(c => c.amount));
              const chartColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.warning, COLORS.info, COLORS.danger];
              return spendingByCategory.map((item, index) => (
                <View key={item.category} style={styles.chartRow}>
                  <Text style={styles.chartLabel} numberOfLines={1}>{item.category}</Text>
                  <View style={styles.chartBarBg}>
                    <View
                      style={[
                        styles.chartBarFill,
                        { width: `${(item.amount / maxAmt) * 100}%`, backgroundColor: chartColors[index % chartColors.length] },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartAmount}>{fmt(item.amount)}</Text>
                </View>
              ));
            })()}
          </Card>
        )}

        {/* Bills */}
        <Card
          title="Pending Bills"
          icon="receipt-outline"
          iconColor={COLORS.danger}
          onPress={() => navigation.navigate('BillsReminders')}
        >
          <Text style={styles.statNumber}>{pendingBills}</Text>
          <Text style={styles.statLabel}>unpaid reminders</Text>
        </Card>

        {/* Savings */}
        <Card
          title="Savings Goals"
          icon="trending-up-outline"
          iconColor={COLORS.accent}
          onPress={() => navigation.navigate('Goals')}
        >
          {savingsGoals.length > 0 ? (
            savingsGoals.map((g) => {
              const pct = g.target_amount > 0
                ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100)
                : 0;
              return (
                <View key={g.id} style={styles.goalRow}>
                  <Text style={styles.goalIcon}>{g.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalName}>{g.name}</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: COLORS.accent }]} />
                    </View>
                    <Text style={styles.goalPct}>{pct.toFixed(0)}%</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyHint}>No savings goals yet</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.xxl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.md },
  balanceAmount: { fontSize: 36, fontWeight: '700', color: COLORS.white, marginVertical: SPACING.sm },
  incExpRow: { flexDirection: 'row', marginTop: SPACING.md, width: '100%' },
  incExpCol: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  incExpLabel: { color: 'rgba(255,255,255,0.6)', fontSize: FONTS.sizes.sm },
  incExpValue: { fontSize: FONTS.sizes.lg, fontWeight: '600', marginTop: 4 },
  budgetText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden', marginBottom: SPACING.xs },
  progressFill: { height: 6, borderRadius: 3 },
  remainText: { fontSize: FONTS.sizes.sm, color: COLORS.success },
  emptyHint: { fontSize: FONTS.sizes.md, color: COLORS.textLight, fontStyle: 'italic' },
  statNumber: { fontSize: 36, fontWeight: '700', color: COLORS.danger },
  statLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  goalIcon: { fontSize: 24 },
  goalName: { fontSize: FONTS.sizes.md, fontWeight: '500', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  goalPct: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  chartLabel: { width: 70, fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textTransform: 'capitalize' },
  chartBarBg: { flex: 1, height: 12, backgroundColor: COLORS.border, borderRadius: 6, overflow: 'hidden' },
  chartBarFill: { height: 12, borderRadius: 6 },
  chartAmount: { width: 70, fontSize: FONTS.sizes.xs, color: COLORS.textPrimary, fontWeight: '600', textAlign: 'right' },
});
