import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import SwipeableRow from '../../components/SwipeableRow';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { RESOURCE_TYPES } from '../../constants/theme';

export default function ResourcesScreen({ navigation }) {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterSubject, setFilterSubject] = useState(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from('resources')
      .select('*, subjects(name, color)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filterSubject) query = query.eq('subject_id', filterSubject);

    const { data } = await query;
    setResources(data ?? []);
    setLoading(false);
  }, [user, filterSubject]);

  const fetchSubjects = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('subjects')
      .select('id, name, color')
      .eq('user_id', user.id)
      .order('name');
    setSubjects(data ?? []);
  }, [user]);

  useEffect(() => {
    fetchResources();
    fetchSubjects();
  }, [fetchResources, fetchSubjects]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchResources);
    return unsub;
  }, [navigation, fetchResources]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchResources();
    setRefreshing(false);
  };

  const handleDelete = async (id) => {
    await supabase.from('resources').delete().eq('id', id);
    fetchResources();
  };

  const handleOpen = (url) => {
    if (url) Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open this URL'));
  };

  const handleCopy = async (url) => {
    if (url) {
      await Clipboard.setStringAsync(url);
      Alert.alert('Copied', 'URL copied to clipboard');
    }
  };

  const getTypeIcon = (type) => {
    const found = RESOURCE_TYPES.find((r) => r.key === type);
    return found?.icon || 'link-outline';
  };

  const getDomain = (url) => {
    if (!url) return '';
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return url.substring(0, 30);
    }
  };

  const filtered = resources.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const renderResource = ({ item }) => (
    <SwipeableRow onDelete={() => handleDelete(item.id)}>
      <TouchableOpacity
        style={styles.resourceCard}
        onPress={() => handleOpen(item.url)}
        onLongPress={() => handleCopy(item.url)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${item.subjects?.color || COLORS.primary}15` }]}>
          <Ionicons name={getTypeIcon(item.resource_type)} size={22} color={item.subjects?.color || COLORS.primary} />
        </View>
        <View style={styles.resourceInfo}>
          <Text style={styles.resourceTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.resourceMeta} numberOfLines={1}>
            {item.subjects?.name ? `${item.subjects.name} · ` : ''}{getDomain(item.url)}
          </Text>
          {item.description ? (
            <Text style={styles.resourceDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddResource', { resource: item })}
          style={styles.editBtn}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
      </TouchableOpacity>
    </SwipeableRow>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search resources..." />

      {/* Subject filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        <TouchableOpacity
          onPress={() => setFilterSubject(null)}
          style={[styles.chip, !filterSubject && styles.chipActive]}
        >
          <Text style={[styles.chipText, !filterSubject && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {subjects.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => setFilterSubject(filterSubject === s.id ? null : s.id)}
            style={[styles.chip, filterSubject === s.id && { backgroundColor: s.color, borderColor: s.color }]}
          >
            <Text style={[styles.chipText, filterSubject === s.id && { color: COLORS.white }]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderResource}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="bookmark-outline"
              title="No Resources Yet"
              message="Save links to lectures, notes, and course materials"
              actionLabel="Add Resource"
              onAction={() => navigation.navigate('AddResource')}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  chipScroll: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm, maxHeight: 44 },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  resourceInfo: { flex: 1 },
  resourceTitle: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  resourceMeta: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  resourceDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, marginTop: 2 },
  editBtn: { padding: SPACING.sm },
});
