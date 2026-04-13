import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setError('');
    setLoading(true);
    const { error: resetErr } = await resetPassword(email.trim());
    setLoading(false);
    if (resetErr) {
      Alert.alert('Error', resetErr.message);
    } else {
      Alert.alert(
        'Email Sent',
        'Check your inbox for the password reset link.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a reset link
          </Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            icon="mail-outline"
            keyboardType="email-address"
            error={error}
          />

          <Button
            title="Send Reset Link"
            onPress={handleReset}
            loading={loading}
            size="lg"
          />

          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            size="md"
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.xxl,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },
});
