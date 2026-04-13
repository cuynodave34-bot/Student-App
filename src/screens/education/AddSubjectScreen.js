import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS, ACCENT_COLORS } from '../../constants/theme';

export default function AddSubjectScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.subject;

  const [name, setName] = useState(editing?.name || '');
  const [code, setCode] = useState(editing?.code || '');
  const [instructor, setInstructor] = useState(editing?.instructor || '');
  const [semester, setSemester] = useState(editing?.semester || '');
  const [room, setRoom] = useState(editing?.room || '');
  const [meetingLink, setMeetingLink] = useState(editing?.meeting_link || '');
  const [color, setColor] = useState(editing?.color || ACCENT_COLORS[0]);
  const [status, setStatus] = useState(editing?.status || 'active');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Subject name is required');
      return;
    }
    setLoading(true);

    const payload = {
      user_id: user.id,
      name: name.trim(),
      code: code.trim() || null,
      instructor: instructor.trim() || null,
      semester: semester.trim() || null,
      room: room.trim() || null,
      meeting_link: meetingLink.trim() || null,
      color,
      status,
    };

    let error;
    if (editing) {
      ({ error } = await supabase
        .from('subjects')
        .update(payload)
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('subjects').insert(payload));
    }

    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{editing ? 'Edit Subject' : 'Add Subject'}</Text>

          <Input label="Subject Name *" value={name} onChangeText={setName} placeholder="e.g. Data Structures" icon="book-outline" autoCapitalize="words" />
          <Input label="Subject Code" value={code} onChangeText={setCode} placeholder="e.g. CS201" icon="code-outline" autoCapitalize="characters" />
          <Input label="Instructor" value={instructor} onChangeText={setInstructor} placeholder="e.g. Prof. Santos" icon="person-outline" autoCapitalize="words" />
          <Input label="Semester / Term" value={semester} onChangeText={setSemester} placeholder="e.g. 1st Sem 2025-2026" icon="calendar-outline" />
          <Input label="Room" value={room} onChangeText={setRoom} placeholder="e.g. Room 301" icon="location-outline" />
          <Input label="Meeting Link" value={meetingLink} onChangeText={setMeetingLink} placeholder="e.g. https://zoom.us/..." icon="link-outline" keyboardType="url" />

          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {ACCENT_COLORS.map((c) => (
              <View
                key={c}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  color === c && styles.colorSelected,
                ]}
                onTouchEnd={() => setColor(c)}
              />
            ))}
          </View>

          {/* Status (only when editing) */}
          {editing && (
            <>
              <Text style={styles.label}>Status</Text>
              <View style={styles.colorRow}>
                {['active', 'completed', 'dropped'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[styles.statusChip, status === s && styles.statusChipActive]}
                  >
                    <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Button
            title={editing ? 'Update Subject' : 'Add Subject'}
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={{ marginTop: SPACING.xl }}
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
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  colorSelected: { borderWidth: 3, borderColor: COLORS.textPrimary },
  statusChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  statusChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusChipText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  statusChipTextActive: { color: COLORS.white },
});
