import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

const ToastContext = createContext({});

export const useToast = () => useContext(ToastContext);

const TOAST_DURATION = 3000;

const TOAST_TYPES = {
  success: { icon: 'checkmark-circle', bgLight: '#ECFDF5', bgDark: '#064E3B', colorLight: '#059669', colorDark: '#34D399' },
  error: { icon: 'close-circle', bgLight: '#FEF2F2', bgDark: '#7F1D1D', colorLight: '#DC2626', colorDark: '#FCA5A5' },
  warning: { icon: 'warning', bgLight: '#FFFBEB', bgDark: '#78350F', colorLight: '#D97706', colorDark: '#FCD34D' },
  info: { icon: 'information-circle', bgLight: '#EFF6FF', bgDark: '#1E3A5F', colorLight: '#2563EB', colorDark: '#93C5FD' },
};

export function ToastProvider({ children }) {
  const { isDark } = useTheme();
  const [toast, setToast] = useState(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const show = useCallback((message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({ message, type });
    translateY.setValue(-100);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, TOAST_DURATION);
  }, [translateY, opacity]);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [translateY, opacity]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const config = toast ? TOAST_TYPES[toast.type] || TOAST_TYPES.info : null;
  const bg = config ? (isDark ? config.bgDark : config.bgLight) : '#fff';
  const color = config ? (isDark ? config.colorDark : config.colorLight) : '#000';

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: bg, transform: [{ translateY }], opacity },
          ]}
        >
          <TouchableOpacity style={styles.inner} onPress={dismiss} activeOpacity={0.8}>
            <Ionicons name={config.icon} size={22} color={color} />
            <Text style={[styles.message, { color }]} numberOfLines={2}>{toast.message}</Text>
            <Ionicons name="close" size={18} color={color} style={{ opacity: 0.6 }} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    left: SPACING.lg,
    right: SPACING.lg,
    borderRadius: RADIUS.md,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  message: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
  },
});
