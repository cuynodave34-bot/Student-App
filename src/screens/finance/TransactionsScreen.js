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

const FILTERS = ['all', 'expense', 'income'];

export default function TransactionsScreen({ navigation }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false });
    if (filter !== 'all') query = query.eq('type', filter);
    const { data } = await query.limit(50);
    setTransactions(data ?? []);
  }, [user, filter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchTransactions);
    return unsub;
  }, [navigation, fetchTransactions]);

  const onRefresh = async () => { setRefreshing(true); await fetchTransactions(); setRefreshing(false); };

  const deleteTransaction = (id) => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await supabase.from('transactions').delete().eq('id', id); fetchTransactions(); },
      },
    ]);
  };

  const fmt = (n) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const renderItem = ({ item }) => (
    <Card onPress={() => navigation.navigate('AddTransaction', { transaction: item })}>
      <View style={styles.txRow}>
        <View style={[styles.typeIcon, { backgroundColor: item.type === 'income' ? `${COLORS.income}15` : `${COLORS.expense}15` }]}>
          <Ionicons
            name={item.type === 'income' ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={20}
            color={item.type === 'income' ? COLORS.income : COLORS.expense}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.txCategory}>{item.category}</Text>
          {item.note && <Text style={styles.txNote} numberOfLines={1}>{item.note}</Text>}
          <Text style={styles.txDate}>{item.transaction_date}</Text>
          {item.is_recurring && (
            <View style={styles.recurringBadge}>
              <Ionicons name="repeat-outline" size={10} color={COLORS.info} />
              <Text style={styles.recurringText}>{item.recurrence_interval || 'recurring'}</Text>
            </View>
          )}
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: item.type === 'income' ? COLORS.income : COLORS.expense }]}>
            {item.type === 'income' ? '+' : '-'}{fmt(item.amount)}
          </Text>
          <TouchableOpacity onPress={() => deleteTransaction(item.id)}>
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search transactions..." />
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={transactions.filter(t => !search || t.category.toLowerCase().includes(search.toLowerCase()) || (t.note && t.note.toLowerCase().includes(search.toLowerCase())))}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="💰"
            title="No transactions yet"
            subtitle="Start tracking your income and expenses to understand your spending."
            actionLabel="Add Transaction"
            actionIcon="add-circle-outline"
            onAction={() => navigation.navigate('AddTransaction')}
          />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTransaction')}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  typeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txCategory: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary, textTransform: 'capitalize' },
  txNote: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  txDate: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 2 },
  recurringBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  recurringText: { fontSize: FONTS.sizes.xs, color: COLORS.info, textTransform: 'capitalize' },
  txRight: { alignItems: 'flex-end', gap: SPACING.xs },
  txAmount: { fontSize: FONTS.sizes.md, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});
