import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../components/LoadingScreen';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function RootNavigator() {
  const { session, loading } = useAuth();
  const { navigationTheme, loaded } = useTheme();
  const [locked, setLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);

  useEffect(() => {
    if (!session) { setCheckingLock(false); return; }
    AsyncStorage.getItem('@slo_biometric_lock').then(async (val) => {
      if (val === 'true') {
        setLocked(true);
        try {
          const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock StudentLife Organizer' });
          if (result.success) setLocked(false);
        } catch {
          // biometric unavailable — skip lock
          setLocked(false);
        }
      }
      setCheckingLock(false);
    }).catch(() => {
      setCheckingLock(false);
    });
  }, [session]);

  if (loading || !loaded || checkingLock) return <LoadingScreen />;

  if (locked) {
    return (
      <View style={lockStyles.container}>
        <Ionicons name="lock-closed" size={64} color={COLORS.primary} />
        <Text style={lockStyles.title}>App Locked</Text>
        <Text style={lockStyles.subtitle}>Authenticate to continue</Text>
        <TouchableOpacity
          style={lockStyles.btn}
          onPress={async () => {
            const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock StudentLife Organizer' });
            if (result.success) setLocked(false);
          }}
        >
          <Ionicons name="finger-print" size={24} color={COLORS.white} />
          <Text style={lockStyles.btnText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const lockStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, gap: SPACING.md },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.lg,
    borderRadius: 50, marginTop: SPACING.xl,
  },
  btnText: { fontSize: FONTS.sizes.lg, fontWeight: '600', color: COLORS.white },
});
