import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { COLORS, FONTS } from '../constants/theme';

// Education screens
import SubjectsScreen from '../screens/education/SubjectsScreen';
import AddSubjectScreen from '../screens/education/AddSubjectScreen';
import SubjectDetailScreen from '../screens/education/SubjectDetailScreen';
import TasksScreen from '../screens/education/TasksScreen';
import AddTaskScreen from '../screens/education/AddTaskScreen';
import AcademicEventsScreen from '../screens/education/AcademicEventsScreen';
import AddAcademicEventScreen from '../screens/education/AddAcademicEventScreen';
import ScheduleScreen from '../screens/education/ScheduleScreen';
import AddScheduleScreen from '../screens/education/AddScheduleScreen';
import NotesScreen from '../screens/education/NotesScreen';
import AddNoteScreen from '../screens/education/AddNoteScreen';
import GradesScreen from '../screens/education/GradesScreen';
import AddGradeScreen from '../screens/education/AddGradeScreen';
import ResourcesScreen from '../screens/education/ResourcesScreen';
import AddResourceScreen from '../screens/education/AddResourceScreen';
import GPACalculatorScreen from '../screens/education/GPACalculatorScreen';
import StudyTimerScreen from '../screens/education/StudyTimerScreen';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

function EducationTabs() {
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
      <Tab.Screen name="Subjects" component={SubjectsScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="AcademicEvents" component={AcademicEventsScreen} options={{ title: 'Events' }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Grades" component={GradesScreen} />
      <Tab.Screen name="Resources" component={ResourcesScreen} />
      <Tab.Screen name="GPA" component={GPACalculatorScreen} />
      <Tab.Screen name="Timer" component={StudyTimerScreen} />
    </Tab.Navigator>
  );
}

export default function EducationNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="EducationTabs"
        component={EducationTabs}
        options={{ title: 'Education' }}
      />
      <Stack.Screen name="AddSubject" component={AddSubjectScreen} options={{ title: 'Subject' }} />
      <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} options={{ title: 'Subject Detail' }} />
      <Stack.Screen name="AddTask" component={AddTaskScreen} options={{ title: 'Task' }} />
      <Stack.Screen name="AddAcademicEvent" component={AddAcademicEventScreen} options={{ title: 'Event' }} />
      <Stack.Screen name="AddSchedule" component={AddScheduleScreen} options={{ title: 'Schedule' }} />
      <Stack.Screen name="AddNote" component={AddNoteScreen} options={{ title: 'Note' }} />
      <Stack.Screen name="AddGrade" component={AddGradeScreen} options={{ title: 'Grade' }} />
      <Stack.Screen name="AddResource" component={AddResourceScreen} options={{ title: 'Resource' }} />
      <Stack.Screen name="GPACalculator" component={GPACalculatorScreen} options={{ title: 'GPA Calculator' }} />
      <Stack.Screen name="StudyTimer" component={StudyTimerScreen} options={{ title: 'Study Timer' }} />
    </Stack.Navigator>
  );
}
