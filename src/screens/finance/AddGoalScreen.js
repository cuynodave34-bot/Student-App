import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

const ICONS = ['🎯', '💻', '📱', '🎓', '✈️', '🏠', '🚗', '💍', '📚', '🎮'];

export default function AddGoalScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.goal;

  const [name, setName] = useState(editing?.name || '');
  const [targetAmount, setTargetAmount] = useState(editing ? String(editing.target_amount) : '');
  const [currentAmount, setCurrentAmount] = useState(editing ? String(editing.current_amount) : '0');
  const [deadline, setDeadline] = useState(editing?.deadline || '');
  const [icon, setIcon] = useState(editing?.icon || '🎯');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !targetAmount) {
      Alert.alert('Validation', 'Goal name and target amount are required');
      return;
    }
    if (isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      Alert.alert('Validation', 'Please enter a valid target amount');
      return;
    }
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      Alert.alert('Validation', 'Deadline must be in YYYY-MM-DD format');
      return;
    }
    setLoading(true);

    const payload = {
      user_id: user.id,
      name: name.trim(),
      target_amount: Number(targetAmount),
      current_amount: Number(currentAmount) || 0,
      deadline: deadline || null,
      icon,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('savings_goals').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('savings_goals').insert(payload));
    }

    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{editing ? 'Edit Goal' : 'Add Savings Goal'}</Text>

          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconRow}>
            {ICONS.map((i) => (
              <Text
                key={i}
                style={[styles.iconOption, icon === i && styles.iconSelected]}
                onPress={() => setIcon(i)}
              >
                {i}
              </Text>
            ))}
          </View>

          <Input label="Goal Name *" value={name} onChangeText={setName} placeholder="e.g. New Laptop" icon="flag-outline" autoCapitalize="sentences" />
          <Input label="Target Amount (₱) *" value={targetAmount} onChangeText={setTargetAmount} placeholder="0.00" icon="cash-outline" keyboardType="decimal-pad" />
          <Input label="Current Amount (₱)" value={currentAmount} onChangeText={setCurrentAmount} placeholder="0.00" icon="wallet-outline" keyboardType="decimal-pad" />
          <Input label="Deadline" value={deadline} onChangeText={setDeadline} placeholder="YYYY-MM-DD" icon="calendar-outline" />

          <Button
            title={editing ? 'Update Goal' : 'Create Goal'}
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
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  iconOption: { fontSize: 32, padding: 4 },
  iconSelected: { borderWidth: 2, borderColor: COLORS.primary, borderRadius: 8 },
});
