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
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { useNotifications } from '../../contexts/NotificationContext';

const BILL_CATEGORIES = ['tuition', 'school fees', 'subscription', 'transport', 'bills', 'rent', 'other'];

export default function AddBillReminderScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.reminder;
  const { scheduleNotification, cancelNotification } = useNotifications();

  const [title, setTitle] = useState(editing?.title || '');
  const [amount, setAmount] = useState(editing?.amount ? String(editing.amount) : '');
  const [dueDate, setDueDate] = useState(editing?.due_date || '');
  const [category, setCategory] = useState(editing?.category || '');
  const [notes, setNotes] = useState(editing?.notes || '');
  const [isRecurring, setIsRecurring] = useState(editing?.is_recurring || false);
  const [recurrenceInterval, setRecurrenceInterval] = useState(editing?.recurrence_interval || 'monthly');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !dueDate) {
      Alert.alert('Validation', 'Title and due date are required');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      Alert.alert('Validation', 'Due date must be in YYYY-MM-DD format');
      return;
    }
    if (amount && (isNaN(Number(amount)) || Number(amount) < 0)) {
      Alert.alert('Validation', 'Please enter a valid amount');
      return;
    }
    setLoading(true);

    const payload = {
      user_id: user.id,
      title: title.trim(),
      amount: amount ? Number(amount) : null,
      due_date: dueDate,
      category: category || null,
      notes: notes.trim() || null,
      is_recurring: isRecurring,
      recurrence_interval: isRecurring ? recurrenceInterval : null,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('payment_reminders').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('payment_reminders').insert(payload));
    }

    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else {
      // Schedule notification
      if (editing) await cancelNotification(`bill_${editing.id}`);
      if (dueDate) {
        const billId = editing?.id || Date.now();
        await scheduleNotification(
          `bill_${billId}`,
          `\ud83d\udcb0 Bill Due: ${title.trim()}`,
          amount ? `\u20b1${Number(amount).toLocaleString()}` : category || 'Payment due today',
          new Date(`${dueDate}T09:00:00`)
        );
      }
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{editing ? 'Edit Reminder' : 'Add Payment Reminder'}</Text>

          <Input label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Tuition Payment" icon="notifications-outline" autoCapitalize="sentences" />
          <Input label="Amount (₱)" value={amount} onChangeText={setAmount} placeholder="0.00" icon="cash-outline" keyboardType="decimal-pad" />
          <Input label="Due Date *" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" icon="calendar-outline" />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {BILL_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.chip, category === c && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional notes..." icon="chatbox-outline" multiline numberOfLines={2} />

          <TouchableOpacity onPress={() => setIsRecurring(!isRecurring)} style={styles.recurringRow}>
            <Text style={styles.recurringLabel}>Recurring reminder</Text>
            <View style={[styles.toggle, isRecurring && styles.toggleActive]}>
              <View style={[styles.toggleDot, isRecurring && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>

          {isRecurring && (
            <>
              <Text style={styles.label}>Repeat Every</Text>
              <View style={styles.chipRow}>
                {['weekly', 'monthly', 'quarterly', 'yearly'].map((interval) => (
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
            title={editing ? 'Update' : 'Add Reminder'}
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
  label: { fontSize: FONTS.sizes.md, fontWeight: '500', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: COLORS.white },
  recurringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md },
  recurringLabel: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: COLORS.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.white },
  toggleDotActive: { alignSelf: 'flex-end' },
});
