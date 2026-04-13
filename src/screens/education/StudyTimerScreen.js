import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const PRESETS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
];

export default function StudyTimerScreen() {
  const [duration, setDuration] = useState(PRESETS[0].seconds);
  const [remaining, setRemaining] = useState(PRESETS[0].seconds);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setSessions((s) => s + 1);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Vibration.vibrate([0, 500, 200, 500]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const toggleTimer = () => {
    if (remaining === 0) {
      setRemaining(duration);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRunning(!running);
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(duration);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectPreset = (seconds) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setDuration(seconds);
    setRemaining(seconds);
  };

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = duration > 0 ? (duration - remaining) / duration : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Study Timer</Text>

      {/* Presets */}
      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.seconds}
            onPress={() => selectPreset(p.seconds)}
            style={[styles.presetChip, duration === p.seconds && styles.presetActive]}
          >
            <Text style={[styles.presetText, duration === p.seconds && styles.presetTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timer display */}
      <View style={styles.timerContainer}>
        <View style={[styles.progressRing, { borderColor: `${COLORS.primary}20` }]}>
          <View style={styles.timerInner}>
            <Text style={styles.timerText}>
              {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </Text>
            <Text style={styles.statusText}>
              {remaining === 0 ? 'Done!' : running ? 'Focusing...' : 'Ready'}
            </Text>
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={resetTimer}>
          <Ionicons name="refresh" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playBtn} onPress={toggleTimer} activeOpacity={0.8}>
          <Ionicons
            name={running ? 'pause' : remaining === 0 ? 'refresh' : 'play'}
            size={36}
            color={COLORS.white}
          />
        </TouchableOpacity>

        <View style={styles.sessionBadge}>
          <Text style={styles.sessionCount}>{sessions}</Text>
          <Text style={styles.sessionLabel}>sessions</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', paddingTop: SPACING.xxl },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xl },
  presetRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xxxl },
  presetChip: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  presetActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  presetText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, fontWeight: '500' },
  presetTextActive: { color: COLORS.white },
  timerContainer: { marginBottom: SPACING.xxxl },
  progressRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: COLORS.primary,
  },
  timerInner: { alignItems: 'center' },
  timerText: { fontSize: 56, fontWeight: '700', color: COLORS.textPrimary, fontVariant: ['tabular-nums'] },
  statusText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginTop: SPACING.sm },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxl,
  },
  secondaryBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionBadge: { alignItems: 'center' },
  sessionCount: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.primary },
  sessionLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
});
