import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { COLORS, FONTS } from '../constants/theme';

// Finance screens
import FinanceOverviewScreen from '../screens/finance/FinanceOverviewScreen';
import TransactionsScreen from '../screens/finance/TransactionsScreen';
import AddTransactionScreen from '../screens/finance/AddTransactionScreen';
import BudgetScreen from '../screens/finance/BudgetScreen';
import GoalsScreen from '../screens/finance/GoalsScreen';
import AddGoalScreen from '../screens/finance/AddGoalScreen';
import BillsRemindersScreen from '../screens/finance/BillsRemindersScreen';
import AddBillReminderScreen from '../screens/finance/AddBillReminderScreen';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

function FinanceTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarLabelStyle: { fontSize: FONTS.sizes.sm, fontWeight: '600', textTransform: 'none' },
        tabBarIndicatorStyle: { backgroundColor: COLORS.primary, height: 3, borderRadius: 2 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: { backgroundColor: COLORS.surface, elevation: 0, shadowOpacity: 0 },
        tabBarItemStyle: { width: 'auto', paddingHorizontal: 16 },
      }}
    >
      <Tab.Screen name="Overview" component={FinanceOverviewScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="BillsReminders" component={BillsRemindersScreen} options={{ title: 'Bills' }} />
    </Tab.Navigator>
  );
}

export default function FinanceNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="FinanceTabs"
        component={FinanceTabs}
        options={{ title: 'Finance' }}
      />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ title: 'Transaction' }} />
      <Stack.Screen name="AddGoal" component={AddGoalScreen} options={{ title: 'Savings Goal' }} />
      <Stack.Screen name="AddBillReminder" component={AddBillReminderScreen} options={{ title: 'Reminder' }} />
    </Stack.Navigator>
  );
}
