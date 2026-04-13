import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { OfflineProvider } from './src/contexts/OfflineContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <OfflineProvider>
            <StatusBar hidden />
            <RootNavigator />
          </OfflineProvider>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
