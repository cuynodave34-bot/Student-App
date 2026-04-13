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
import SearchBar from '../../components/SearchBar';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

export default function NotesScreen({ navigation }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notes')
      .select('*, subjects(name, color)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setNotes(data ?? []);
  }, [user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchNotes);
    return unsub;
  }, [navigation, fetchNotes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  const deleteNote = (id) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('notes').delete().eq('id', id);
          fetchNotes();
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <Card onPress={() => navigation.navigate('AddNote', { note: item })}>
      <View style={styles.noteRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
          {item.content && (
            <Text style={styles.noteContent} numberOfLines={2}>{item.content}</Text>
          )}
          <View style={styles.metaRow}>
            {item.subjects && <Text style={styles.subject}>📚 {item.subjects.name}</Text>}
            <Text style={styles.date}>{new Date(item.updated_at).toLocaleDateString()}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => deleteNote(item.id)}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search notes..." />
      <FlatList
        data={notes.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content && n.content.toLowerCase().includes(search.toLowerCase())))}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="📝"
            title="No notes yet"
            subtitle="Jot down quick notes, lecture reminders, or ideas for any subject."
            actionLabel="Add Note"
            actionIcon="add-circle-outline"
            onAction={() => navigation.navigate('AddNote')}
          />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddNote')}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  noteRow: { flexDirection: 'row', gap: SPACING.sm },
  noteTitle: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary },
  noteContent: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  metaRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  subject: { fontSize: FONTS.sizes.xs, color: COLORS.primary },
  date: { fontSize: FONTS.sizes.xs, color: COLORS.textLight },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});
