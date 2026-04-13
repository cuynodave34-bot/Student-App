import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const OfflineContext = createContext({});

const QUEUE_KEY = '@slo_offline_queue';

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // Monitor connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);
    });
    // Load persisted queue
    AsyncStorage.getItem(QUEUE_KEY).then((raw) => {
      if (raw) setQueue(JSON.parse(raw));
    });
    return () => unsubscribe();
  }, []);

  // Show/hide offline banner
  useEffect(() => {
    Animated.timing(bannerOpacity, {
      toValue: isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  // Auto-flush when back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !syncing) flushQueue();
  }, [isOnline, queue.length]);

  const enqueue = useCallback(async (table, action, payload) => {
    const item = { table, action, payload, created_at: Date.now() };
    const next = [...queue, item];
    setQueue(next);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  }, [queue]);

  const flushQueue = useCallback(async () => {
    if (queue.length === 0) return;
    setSyncing(true);
    const remaining = [];

    for (const item of queue) {
      let error;
      if (item.action === 'insert') {
        ({ error } = await supabase.from(item.table).insert(item.payload));
      } else if (item.action === 'update') {
        const { id, ...rest } = item.payload;
        ({ error } = await supabase.from(item.table).update(rest).eq('id', id));
      } else if (item.action === 'delete') {
        ({ error } = await supabase.from(item.table).delete().eq('id', item.payload.id));
      }
      if (error) remaining.push(item);
    }

    setQueue(remaining);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    setSyncing(false);
  }, [queue]);

  return (
    <OfflineContext.Provider value={{ isOnline, enqueue, flushQueue, pendingCount: queue.length, syncing }}>
      {children}
      <Animated.View style={[styles.banner, { opacity: bannerOpacity }]} pointerEvents={isOnline ? 'none' : 'auto'}>
        <Text style={styles.bannerText}>
          {syncing ? '⟳ Syncing...' : '⚡ Offline — changes will sync when connected'}
        </Text>
        {queue.length > 0 && <Text style={styles.badgeText}>{queue.length} pending</Text>}
      </Animated.View>
    </OfflineContext.Provider>
  );
}

export const useOffline = () => useContext(OfflineContext);

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  bannerText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: '#1a1a1a',
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
});
