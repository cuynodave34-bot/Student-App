import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

export default function BillsRemindersScreen({ navigation }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('payment_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });
    setReminders(data ?? []);
  }, [user]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchReminders);
    return unsub;
  }, [navigation, fetchReminders]);

  const onRefresh = async () => { setRefreshing(true); await fetchReminders(); setRefreshing(false); };

  const togglePaid = async (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await supabase.from('payment_reminders').update({ is_paid: !item.is_paid }).eq('id', item.id);
    fetchReminders();
  };

  const deleteReminder = (id) => {
    Alert.alert('Delete Reminder', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('payment_reminders').delete().eq('id', id); fetchReminders(); } },
    ]);
  };

  const fmt = (n) => n ? `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '';

  const renderItem = ({ item }) => {
    const isPast = new Date(item.due_date) < new Date() && !item.is_paid;

    return (
      <Card onPress={() => navigation.navigate('AddBillReminder', { reminder: item })}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => togglePaid(item)}>
            <Ionicons
              name={item.is_paid ? 'checkbox' : 'square-outline'}
              size={24}
              color={item.is_paid ? COLORS.success : COLORS.textLight}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, item.is_paid && styles.paidTitle]}>{item.title}</Text>
            {item.amount && <Text style={styles.amount}>{fmt(item.amount)}</Text>}
            <Text style={[styles.dueDate, isPast && styles.overdue]}>
              Due: {item.due_date} {isPast ? '(Overdue!)' : ''}
            </Text>
            {item.category && <Text style={styles.category}>{item.category}</Text>}
          </View>
          <TouchableOpacity onPress={() => deleteReminder(item.id)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reminders}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="🔔"
            title="No reminders yet"
            subtitle="Never miss a payment — add reminders for tuition, bills, and fees."
            actionLabel="Add Reminder"
            actionIcon="add-circle-outline"
            onAction={() => navigation.navigate('AddBillReminder')}
          />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddBillReminder')}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary },
  paidTitle: { textDecorationLine: 'line-through', color: COLORS.textLight },
  amount: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.primary, marginTop: 2 },
  dueDate: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  overdue: { color: COLORS.danger, fontWeight: '600' },
  category: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, textTransform: 'capitalize', marginTop: 2 },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});
