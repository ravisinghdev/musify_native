import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Music, ArrowRight } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { RootStackParamList } from '../../navigation/types';

export const AuthScreen: React.FC<{ mode: 'login' | 'register' }> = ({ mode }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useThemeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isLogin = mode === 'login';

  const handleContinue = () => {
    // Navigate straight to Main App
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Logo Brand */}
        <View style={styles.brandRow}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
            <Music size={28} color="#FFFFFF" />
          </View>
          <Text style={[styles.brandText, { color: colors.textPrimary }]}>
            MUSI<Text style={{ color: colors.primary }}>FY</Text>
          </Text>
        </View>

        <Text style={[styles.heading, { color: colors.textPrimary }]}>
          {isLogin ? 'Welcome back to high-res sound' : 'Create your lossless streaming account'}
        </Text>
        <Text style={[styles.subheading, { color: colors.textSecondary }]}>
          Experience music and 4K visual concert streams without boundaries.
        </Text>

        {/* Inputs */}
        <View style={styles.form}>
          <TextInput
            placeholder="Email address"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
          />

          <TouchableOpacity
            onPress={handleContinue}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinue}
            style={styles.guestButton}
          >
            <Text style={[styles.guestText, { color: colors.textSecondary }]}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  form: {
    gap: 14,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

