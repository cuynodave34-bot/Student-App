import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function AddNoteScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.note;

  const [title, setTitle] = useState(editing?.title || '');
  const [content, setContent] = useState(editing?.content || '');
  const [subjectId, setSubjectId] = useState(editing?.subject_id || null);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const contentRef = useRef(null);

  const insertFormatting = (prefix, suffix) => {
    setContent((prev) => prev + prefix + suffix);
    setTimeout(() => contentRef.current?.focus(), 50);
  };

  useEffect(() => {
    if (!user) return;
    supabase.from('subjects').select('id, name, color').eq('user_id', user.id).order('name')
      .then(({ data }) => setSubjects(data ?? []));
  }, [user]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Note title is required');
      return;
    }
    setLoading(true);

    const payload = {
      user_id: user.id,
      title: title.trim(),
      content: content.trim() || null,
      subject_id: subjectId,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('notes').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('notes').insert(payload));
    }

    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{editing ? 'Edit Note' : 'Add Note'}</Text>

          <Input label="Title *" value={title} onChangeText={setTitle} placeholder="Note title" icon="document-text-outline" autoCapitalize="sentences" />

          {/* Subject */}
          <Text style={styles.label}>Subject (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity onPress={() => setSubjectId(null)} style={[styles.chip, !subjectId && styles.chipActive]}>
              <Text style={[styles.chipText, !subjectId && styles.chipTextActive]}>None</Text>
            </TouchableOpacity>
            {subjects.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSubjectId(s.id)}
                style={[styles.chip, subjectId === s.id && { backgroundColor: s.color, borderColor: s.color }]}
              >
                <Text style={[styles.chipText, subjectId === s.id && { color: COLORS.white }]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Formatting toolbar + note editor */}
          <Text style={styles.label}>Content</Text>
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormatting('**', '**')} accessibilityLabel="Bold">
              <Ionicons name="text" size={18} color={COLORS.textPrimary} />
              <Text style={styles.toolLabel}>B</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormatting('_', '_')} accessibilityLabel="Italic">
              <Text style={[styles.toolLabel, { fontStyle: 'italic' }]}>I</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormatting('\n- ', '')} accessibilityLabel="Bullet list">
              <Ionicons name="list-outline" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => insertFormatting('\n## ', '')} accessibilityLabel="Heading">
              <Text style={styles.toolLabel}>H</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            ref={contentRef}
            style={styles.noteEditor}
            value={content}
            onChangeText={setContent}
            placeholder="Write your note here..."
            placeholderTextColor={COLORS.textLight}
            multiline
            textAlignVertical="top"
            autoCapitalize="sentences"
          />

          <Button
            title={editing ? 'Update Note' : 'Save Note'}
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
  chipScroll: { marginBottom: SPACING.lg },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
  },
  toolLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  noteEditor: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    minHeight: 200,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
