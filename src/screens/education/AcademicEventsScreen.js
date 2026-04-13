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
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const TYPE_ICONS = {
  quiz: 'help-circle-outline',
  exam: 'document-text-outline',
  recitation: 'mic-outline',
  presentation: 'easel-outline',
  defense: 'shield-outline',
  other: 'ellipsis-horizontal-outline',
};

const TYPE_COLORS = {
  quiz: COLORS.warning,
  exam: COLORS.danger,
  recitation: COLORS.info,
  presentation: COLORS.accent,
  defense: COLORS.primaryDark,
  other: COLORS.textLight,
};

export default function AcademicEventsScreen({ navigation }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('academic_events')
      .select('*, subjects(name, color)')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true });
    setEvents(data ?? []);
  }, [user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchEvents);
    return unsub;
  }, [navigation, fetchEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const deleteEvent = (id) => {
    Alert.alert('Delete Event', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('academic_events').delete().eq('id', id);
          fetchEvents();
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const typeColor = TYPE_COLORS[item.event_type] || COLORS.textLight;

    return (
      <Card onPress={() => navigation.navigate('AddAcademicEvent', { event: item })}>
        <View style={styles.eventRow}>
          <View style={[styles.typeIcon, { backgroundColor: `${typeColor}15` }]}>
            <Ionicons name={TYPE_ICONS[item.event_type] || 'ellipsis-horizontal-outline'} size={24} color={typeColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.tag, { backgroundColor: `${typeColor}20` }]}>
                <Text style={[styles.tagText, { color: typeColor }]}>{item.event_type}</Text>
              </View>
              {item.subjects && (
                <Text style={styles.subject}>{item.subjects.name}</Text>
              )}
            </View>
            <Text style={styles.dateText}>
              {item.event_date}{item.event_time ? ` at ${item.event_time.slice(0, 5)}` : ''}
            </Text>
            {item.location && <Text style={styles.location}>📍 {item.location}</Text>}
            {item.coverage && <Text style={styles.coverage} numberOfLines={2}>Coverage: {item.coverage}</Text>}
          </View>
          <TouchableOpacity onPress={() => deleteEvent(item.id)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="📝"
            title="No academic events"
            subtitle="Track upcoming quizzes, exams, presentations, and other important dates."
            actionLabel="Add Event"
            actionIcon="add-circle-outline"
            onAction={() => navigation.navigate('AddAcademicEvent')}
          />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddAcademicEvent')}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg, paddingBottom: 80 },
  eventRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  typeIcon: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.textPrimary },
  metaRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs },
  tag: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
  tagText: { fontSize: FONTS.sizes.xs, fontWeight: '500', textTransform: 'capitalize' },
  subject: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, alignSelf: 'center' },
  dateText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  location: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  coverage: { fontSize: FONTS.sizes.sm, color: COLORS.textLight, marginTop: 2, fontStyle: 'italic' },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});
