import React, { useState } from 'react';
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
import { COLORS, FONTS, SPACING, RADIUS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/theme';

export default function AddTransactionScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.transaction;

  const [type, setType] = useState(editing?.type || 'expense');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [category, setCategory] = useState(editing?.category || '');
  const [paymentMethod, setPaymentMethod] = useState(editing?.payment_method || '');
  const [note, setNote] = useState(editing?.note || '');
  const [transactionDate, setTransactionDate] = useState(
    editing?.transaction_date || new Date().toISOString().split('T')[0]
  );
  const [isRecurring, setIsRecurring] = useState(editing?.is_recurring || false);
  const [recurrenceInterval, setRecurrenceInterval] = useState(editing?.recurrence_interval || 'monthly');
  const [loading, setLoading] = useState(false);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSave = async () => {
    if (!amount || !category) {
      Alert.alert('Validation', 'Amount and category are required');
      return;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Validation', 'Please enter a valid amount');
      return;
    }
    setLoading(true);

    const payload = {
      user_id: user.id,
      type,
      amount: Number(amount),
      category,
      payment_method: paymentMethod.trim() || null,
      note: note.trim() || null,
      transaction_date: transactionDate,
      is_recurring: isRecurring,
      recurrence_interval: isRecurring ? recurrenceInterval : null,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('transactions').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('transactions').insert(payload));
    }

    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{editing ? 'Edit Transaction' : 'Add Transaction'}</Text>

          {/* Type Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              onPress={() => { setType('expense'); setCategory(''); }}
              style={[styles.typeBtn, type === 'expense' && { backgroundColor: COLORS.expense }]}
            >
              <Text style={[styles.typeText, type === 'expense' && { color: COLORS.white }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setType('income'); setCategory(''); }}
              style={[styles.typeBtn, type === 'income' && { backgroundColor: COLORS.income }]}
            >
              <Text style={[styles.typeText, type === 'income' && { color: COLORS.white }]}>Income</Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Amount (₱) *"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            icon="cash-outline"
            keyboardType="decimal-pad"
          />

          {/* Category */}
          <Text style={styles.label}>Category *</Text>
          <View style={styles.chipRow}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[styles.chip, category === c.key && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Date" value={transactionDate} onChangeText={setTransactionDate} placeholder="YYYY-MM-DD" icon="calendar-outline" />

          {/* Payment Method Presets */}
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.chipRow}>
            {['Cash', 'GCash', 'Maya', 'Bank Transfer', 'Credit Card', 'Debit Card'].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setPaymentMethod(paymentMethod === m ? '' : m)}
                style={[styles.chip, paymentMethod === m && styles.chipActive]}
              >
                <Text style={[styles.chipText, paymentMethod === m && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Note" value={note} onChangeText={setNote} placeholder="Optional note..." icon="chatbox-outline" autoCapitalize="sentences" />

          {/* Recurring toggle */}
          <TouchableOpacity
            onPress={() => setIsRecurring(!isRecurring)}
            style={styles.recurringRow}
          >
            <Text style={styles.recurringLabel}>Recurring transaction</Text>
            <View style={[styles.toggle, isRecurring && styles.toggleActive]}>
              <View style={[styles.toggleDot, isRecurring && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>

          {isRecurring && (
            <>
              <Text style={styles.label}>Repeat Every</Text>
              <View style={styles.chipRow}>
                {['daily', 'weekly', 'monthly', 'yearly'].map((interval) => (
                  <TouchableOpacity
                    key={interval}
                    onPress={() => setRecurrenceInterval(interval)}
                    style={[styles.chip, recurrenceInterval === interval && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, recurrenceInterval === interval && styles.chipTextActive]}>
                      {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Button
            title={editing ? 'Update' : 'Save Transaction'}
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
  typeToggle: {
    flexDirection: 'row', backgroundColor: COLORS.border, borderRadius: RADIUS.md,
    padding: 3, marginBottom: SPACING.xl,
  },
  typeBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.sm, alignItems: 'center' },
  typeText: { fontWeight: '600', fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  label: { fontSize: FONTS.sizes.md, fontWeight: '500', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  recurringRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  recurringLabel: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  toggle: {
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: COLORS.border, justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.white },
  toggleDotActive: { alignSelf: 'flex-end' },
});
