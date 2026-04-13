import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Share,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS, ACCENT_COLORS } from '../../constants/theme';

export default function SettingsScreen({ navigation }) {
  const { profile, user, signOut, updateProfile } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [university, setUniversity] = useState(profile?.university || '');
  const [course, setCourse] = useState(profile?.course || '');
  const [yearLevel, setYearLevel] = useState(profile?.year_level || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  React.useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(setBiometricAvailable);
    AsyncStorage.getItem('@slo_biometric_lock').then((val) => setBiometricEnabled(val === 'true'));
  }, []);

  const toggleBiometric = async (value) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Verify to enable app lock' });
      if (!result.success) return;
    }
    await AsyncStorage.setItem('@slo_biometric_lock', value ? 'true' : 'false');
    setBiometricEnabled(value);
  };

  const exportCSV = async (table, filename, columns) => {
    setExporting(true);
    try {
      const { data, error } = await supabase.from(table).select(columns.join(',')).eq('user_id', user.id);
      if (error) throw error;
      if (!data?.length) { Alert.alert('Export', 'No data to export.'); return; }
      const header = columns.join(',');
      const rows = data.map((r) => columns.map((c) => {
        const val = r[c] ?? '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(','));
      const csv = [header, ...rows].join('\n');
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    } catch (e) {
      Alert.alert('Export Error', e.message);
    } finally {
      setExporting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      university: university.trim() || null,
      course: course.trim() || null,
      year_level: yearLevel.trim() || null,
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else setEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.full_name || 'S').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile?.full_name || 'Student'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* Profile info */}
        <Card title="Profile" icon="person-outline" iconColor={COLORS.primary}>
          {editing ? (
            <>
              <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your name" autoCapitalize="words" />
              <Input label="University" value={university} onChangeText={setUniversity} placeholder="e.g. University of the Philippines" autoCapitalize="words" />
              <Input label="Course" value={course} onChangeText={setCourse} placeholder="e.g. BS Computer Science" autoCapitalize="words" />
              <Input label="Year Level" value={yearLevel} onChangeText={setYearLevel} placeholder="e.g. 3rd Year" />
              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                <Button title="Cancel" variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
                <Button title="Save" onPress={handleSave} loading={loading} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <ProfileRow label="Name" value={profile?.full_name} />
              <ProfileRow label="Email" value={user?.email} />
              <ProfileRow label="University" value={profile?.university} />
              <ProfileRow label="Course" value={profile?.course} />
              <ProfileRow label="Year Level" value={profile?.year_level} />
              <Button title="Edit Profile" variant="outline" onPress={() => setEditing(true)} style={{ marginTop: SPACING.md }} />
            </>
          )}
        </Card>

        {/* App Settings */}
        <Card title="Appearance" icon="color-palette-outline" iconColor={COLORS.accent}>
          <View style={styles.settingsRow}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={COLORS.textSecondary} />
            <Text style={styles.settingsLabel}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: COLORS.border, true: `${COLORS.primary}60` }}
              thumbColor={isDark ? COLORS.primary : COLORS.textLight}
            />
          </View>
          {biometricAvailable && (
            <View style={styles.settingsRow}>
              <Ionicons name="finger-print-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.settingsLabel}>App Lock (Biometric)</Text>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: COLORS.border, true: `${COLORS.primary}60` }}
                thumbColor={biometricEnabled ? COLORS.primary : COLORS.textLight}
              />
            </View>
          )}
        </Card>

        <Card title="App" icon="settings-outline" iconColor={COLORS.info}>
          <SettingsRow icon="notifications-outline" label="Notifications" value="Enabled" />
          <SettingsRow icon="cash-outline" label="Currency" value={profile?.currency || '₱'} />
          <SettingsRow icon="information-circle-outline" label="Version" value="1.1.0" />
        </Card>

        {/* Export Data */}
        <Card title="Export Data" icon="download-outline" iconColor={COLORS.success}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => exportCSV('transactions', 'transactions.csv', ['id','type','amount','category','note','date','is_recurring','recurrence_interval'])}
            disabled={exporting}
          >
            <Ionicons name="cash-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.settingsLabel}>Export Transactions</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => exportCSV('tasks', 'tasks.csv', ['id','title','description','priority','status','due_date','due_time'])}
            disabled={exporting}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.settingsLabel}>Export Tasks</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => exportCSV('notes', 'notes.csv', ['id','title','content','created_at'])}
            disabled={exporting}
          >
            <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.settingsLabel}>Export Notes</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </Card>

        {/* Actions */}
        <Card>
          <TouchableOpacity style={styles.dangerRow} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
            <Text style={styles.dangerText}>Sign Out</Text>
          </TouchableOpacity>
        </Card>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({ label, value }) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>{value || '—'}</Text>
    </View>
  );
}

function SettingsRow({ icon, label, value }) {
  return (
    <View style={styles.settingsRow}>
      <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  profileHeader: { alignItems: 'center', paddingVertical: SPACING.xxl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: COLORS.white },
  profileName: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.textPrimary },
  profileEmail: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginTop: 4 },
  profileRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  profileLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  profileValue: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, fontWeight: '500' },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  settingsLabel: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  settingsValue: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  dangerText: { fontSize: FONTS.sizes.lg, color: COLORS.danger, fontWeight: '600' },
});
