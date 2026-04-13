import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function SkeletonCard({ lines = 3, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[styles.card, style, { opacity }]}>
      <View style={styles.lineShort} />
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={[styles.line, i === lines - 1 && styles.lineMedium]} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  lineShort: {
    width: '40%',
    height: 14,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  line: {
    width: '100%',
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  lineMedium: {
    width: '70%',
  },
});
