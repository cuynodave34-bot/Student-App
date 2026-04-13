import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const NotificationContext = createContext({});

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_IDS_KEY = '@slo_notification_ids';

async function getNotifMap() {
  const raw = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function setNotifMap(map) {
  await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(map));
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Can handle navigation from notification tap here if needed
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const registerForPushNotifications = async () => {
    if (Platform.OS === 'web') return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
      });
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;

      // Save token to DB if user is logged in
      if (user && token) {
        await supabase.from('push_tokens').upsert(
          { user_id: user.id, expo_push_token: token, device_name: Device.default?.deviceName || 'Unknown' },
          { onConflict: 'user_id,expo_push_token' }
        );
      }
    } catch (e) {
      // Push tokens may not work in Expo Go simulator — fail silently
    }
  };

  const scheduleNotification = async (entityId, title, body, triggerDate) => {
    if (Platform.OS === 'web') return;

    const trigger = new Date(triggerDate);
    if (trigger <= new Date()) return; // Don't schedule past notifications

    try {
      const notifId = await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger,
      });

      // Store mapping for cancellation
      const map = await getNotifMap();
      map[entityId] = notifId;
      await setNotifMap(map);

      return notifId;
    } catch (e) {
      // Fail silently — notifications are nice-to-have
    }
  };

  const cancelNotification = async (entityId) => {
    try {
      const map = await getNotifMap();
      const notifId = map[entityId];
      if (notifId) {
        await Notifications.cancelScheduledNotificationAsync(notifId);
        delete map[entityId];
        await setNotifMap(map);
      }
    } catch (e) {
      // Fail silently
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await setNotifMap({});
    } catch (e) {
      // Fail silently
    }
  };

  const rescheduleUpcoming = async () => {
    if (!user) return;

    // Re-schedule task notifications
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, due_time, subjects(name)')
      .eq('user_id', user.id)
      .neq('status', 'done')
      .gte('due_date', new Date().toISOString().split('T')[0]);

    if (tasks) {
      for (const t of tasks) {
        if (!t.due_date) continue;
        const triggerTime = t.due_time
          ? new Date(`${t.due_date}T${t.due_time}`)
          : new Date(`${t.due_date}T09:00:00`);
        triggerTime.setHours(triggerTime.getHours() - 1);
        await scheduleNotification(
          `task_${t.id}`,
          `📋 Task Due: ${t.title}`,
          t.subjects?.name ? `${t.subjects.name}` : 'Due soon',
          triggerTime
        );
      }
    }

    // Re-schedule event notifications
    const { data: events } = await supabase
      .from('academic_events')
      .select('id, title, event_type, event_date, event_time, reminder_minutes, subjects(name)')
      .eq('user_id', user.id)
      .gte('event_date', new Date().toISOString().split('T')[0]);

    if (events) {
      for (const e of events) {
        const baseTime = e.event_time
          ? new Date(`${e.event_date}T${e.event_time}`)
          : new Date(`${e.event_date}T08:00:00`);
        baseTime.setMinutes(baseTime.getMinutes() - (e.reminder_minutes || 60));
        await scheduleNotification(
          `event_${e.id}`,
          `📚 ${e.event_type?.charAt(0).toUpperCase() + e.event_type?.slice(1)}: ${e.title}`,
          e.subjects?.name ? `${e.subjects.name}` : 'Upcoming event',
          baseTime
        );
      }
    }

    // Re-schedule bill notifications
    const { data: bills } = await supabase
      .from('payment_reminders')
      .select('id, title, amount, due_date, category')
      .eq('user_id', user.id)
      .eq('is_paid', false)
      .gte('due_date', new Date().toISOString().split('T')[0]);

    if (bills) {
      for (const b of bills) {
        await scheduleNotification(
          `bill_${b.id}`,
          `💰 Bill Due: ${b.title}`,
          b.amount ? `₱${Number(b.amount).toLocaleString()}` : b.category || 'Payment due today',
          new Date(`${b.due_date}T09:00:00`)
        );
      }
    }
  };

  return (
    <NotificationContext.Provider value={{
      scheduleNotification,
      cancelNotification,
      cancelAllNotifications,
      rescheduleUpcoming,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
