import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const ACTIONS = [
  { key: 'task', icon: 'checkbox-outline', label: 'New Task', route: 'Education', screen: 'AddTask', color: '#6C63FF' },
  { key: 'event', icon: 'calendar-outline', label: 'Quiz / Event', route: 'Education', screen: 'AddAcademicEvent', color: '#F39C12' },
  { key: 'grade', icon: 'school-outline', label: 'Add Grade', route: 'Education', screen: 'AddGrade', color: '#2ECC71' },
  { key: 'expense', icon: 'cash-outline', label: 'Expense', route: 'Finance', screen: 'AddTransaction', color: '#E74C3C' },
  { key: 'note', icon: 'document-text-outline', label: 'Quick Note', route: 'Education', screen: 'AddNote', color: '#4ECDC4' },
  { key: 'resource', icon: 'bookmark-outline', label: 'Resource', route: 'Education', screen: 'AddResource', color: '#9B59B6' },
  { key: 'reminder', icon: 'notifications-outline', label: 'Reminder', route: 'Finance', screen: 'AddBillReminder', color: '#3498DB' },
];

export default function FloatingActionButton() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    if (open) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setOpen(false));
    } else {
      setOpen(true);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleAction = (action) => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setOpen(false);
      navigation.navigate(action.route, { screen: action.screen });
    });
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {open && (
        <Pressable style={styles.overlay} onPress={toggle}>
          <View style={[styles.overlayBg, { backgroundColor: colors.black }]} />
        </Pressable>
      )}

      {open && (
        <View style={styles.actionsContainer} pointerEvents="box-none">
          {ACTIONS.map((action, index) => {
            const translateY = scaleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -(60 * (index + 1))],
            });
            const itemOpacity = scaleAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0, 1],
            });

            return (
              <Animated.View
                key={action.key}
                style={[
                  styles.actionItem,
                  {
                    transform: [{ translateY }, { scale: scaleAnim }],
                    opacity: itemOpacity,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleAction(action)}
                  style={styles.actionRow}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionLabel, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.actionText, { color: colors.textPrimary }]}>{action.label}</Text>
                  </View>
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon} size={22} color="#fff" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}

      <Animated.View style={[styles.fab, { transform: [{ rotate: rotation }] }]}>
        <TouchableOpacity
          onPress={toggle}
          style={[styles.fabButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 76,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  actionItem: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionLabel: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    ...SHADOWS.md,
  },
  actionText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 76,
    right: 20,
    zIndex: 1000,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
