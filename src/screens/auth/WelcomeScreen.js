import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🎓</Text>
          <Text style={styles.appName}>StudentLife</Text>
          <Text style={styles.tagline}>
            Your academic planner {'\n'}& finance organizer
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem icon="📚" text="Manage subjects, tasks & exams" />
          <FeatureItem icon="💰" text="Track expenses & budgets" />
          <FeatureItem icon="📅" text="Unified calendar & reminders" />
          <FeatureItem icon="📝" text="Quick notes & schedules" />
        </View>

        <View style={styles.buttons}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('SignUp')}
            size="lg"
          />
          <Button
            title="I already have an account"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            size="lg"
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxxl,
  },
  hero: {
    alignItems: 'center',
    marginTop: SPACING.xxxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  appName: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tagline: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 26,
  },
  features: {
    gap: SPACING.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
  },
  buttons: {
    marginTop: SPACING.xxl,
  },
});
