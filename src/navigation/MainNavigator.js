import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import FloatingActionButton from '../components/FloatingActionButton';

import DashboardScreen from '../screens/main/DashboardScreen';
import EducationNavigator from './EducationNavigator';
import FinanceNavigator from './FinanceNavigator';
import CalendarScreen from '../screens/main/CalendarScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { active: 'home', inactive: 'home-outline' },
  Education: { active: 'school', inactive: 'school-outline' },
  Finance: { active: 'wallet', inactive: 'wallet-outline' },
  Calendar: { active: 'calendar', inactive: 'calendar-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

export default function MainNavigator() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            return (
              <Ionicons
                name={focused ? icons.active : icons.inactive}
                size={22}
                color={color}
              />
            );
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight,
          tabBarLabelStyle: { fontSize: FONTS.sizes.xs, fontWeight: '500' },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={DashboardScreen} />
        <Tab.Screen
          name="Education"
          component={EducationNavigator}
          options={{ tabBarLabel: 'Edu' }}
        />
        <Tab.Screen name="Finance" component={FinanceNavigator} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
      <FloatingActionButton />
    </View>
  );
}
