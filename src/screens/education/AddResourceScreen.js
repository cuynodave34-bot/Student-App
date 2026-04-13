import React, { useState, useEffect } from 'react';
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
import { RESOURCE_TYPES } from '../../constants/theme';

// Auto-detect resource type from URL domain
function detectResourceType(url) {
  if (!url) return 'link';
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) return 'video';
  if (lower.includes('docs.google.com') || lower.includes('.pdf') || lower.includes('.docx') || lower.includes('.pptx')) return 'document';
  if (lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.gif') || lower.includes('.webp')) return 'image';
  return 'link';
}

export default function AddResourceScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.resource;
  const prefillSubject = route.params?.prefillSubject;

  const [title, setTitle] = useState(editing?.title || '');
  const [url, setUrl] = useState(editing?.url || '');
  const [resourceType, setResourceType] = useState(editing?.resource_type || 'link');
  const [subjectId, setSubjectId] = useState(editing?.subject_id || prefillSubject || null);
  const [description, setDescription] = useState(editing?.description || '');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('subjects').select('id, name, color').eq('user_id', user.id).order('name')
      .then(({ data }) => setSubjects(data ?? []));
  }, [user]);

  // Auto-detect type when URL changes (only when not editing)
  useEffect(() => {
    if (!editing && url.length > 10) {
      const detected = detectResourceType(url);
      setResourceType(detected);
    }
  }, [url]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }

    setLoading(true);
    const payload = {
      user_id: user.id,
      subject_id: subjectId,
      title: title.trim(),
      url: url.trim() || null,
      resource_type: resourceType,
      description: description.trim() || null,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('resources').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('resources').insert(payload));
    }

    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{editing ? 'Edit Resource' : 'Add Resource'}</Text>

          <Input label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Lecture Notes Ch. 5" icon="bookmark-outline" autoCapitalize="sentences" />
          <Input label="URL" value={url} onChangeText={setUrl} placeholder="https://..." icon="link-outline" keyboardType="url" autoCapitalize="none" autoCorrect={false} />

          {/* Resource Type */}
          <Text style={styles.label}>Type</Text>
          <View style={styles.chipRow}>
            {RESOURCE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setResourceType(t.key)}
                style={[styles.chip, resourceType === t.key && styles.chipActive]}
              >
                <Text style={[styles.chipText, resourceType === t.key && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Subject */}
          <Text style={styles.label}>Subject</Text>
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

          <Input label="Description" value={description} onChangeText={setDescription} placeholder="What is this resource about?" icon="chatbox-outline" multiline numberOfLines={3} />

          <Button
            title={editing ? 'Update Resource' : 'Add Resource'}
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
  label: { fontSize: FONTS.sizes.md, fontWeight: '500', color: COLORS.textPrimary, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  chipScroll: { marginBottom: SPACING.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
});
