import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function SwipeableRow({ children, onDelete, onEdit }) {
  const swipeableRef = useRef(null);

  const renderRightActions = (progress) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [120, 0],
    });

    return (
      <Animated.View style={[styles.actionsContainer, { transform: [{ translateX }] }]}>
        {onEdit && (
          <View style={[styles.action, { backgroundColor: COLORS.info }]}>
            <Ionicons name="create-outline" size={20} color={COLORS.white} />
            <Text style={styles.actionText}>Edit</Text>
          </View>
        )}
        {onDelete && (
          <View style={[styles.action, { backgroundColor: COLORS.danger }]}>
            <Ionicons name="trash-outline" size={20} color={COLORS.white} />
            <Text style={styles.actionText}>Delete</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const handleSwipeOpen = (direction) => {
    if (direction === 'right') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (onDelete) {
        onDelete();
      }
      swipeableRef.current?.close();
    }
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      rightThreshold={40}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  action: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '100%',
    paddingVertical: SPACING.sm,
  },
  actionText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    marginTop: 2,
  },
});
