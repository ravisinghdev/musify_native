import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  ArrowRight,
  Mail,
  Lock,
  User,
  Database,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { hapticFeedback } from '../../utils/haptics';
import { cloudService } from '../../services/supabase/cloudService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AuthMode = 'signin' | 'signup' | 'forgot' | 'verify_reset' | 'verify_signup';

export const AuthScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [successInfo, setSuccessInfo] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigateToApp = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleAuthAction = async () => {
    setErrorMessage('');
    setSuccessInfo('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (authMode === 'signin') {
      if (!cleanPassword) {
        setErrorMessage('Please enter your password.');
        return;
      }
      setIsLoading(true);
      hapticFeedback.medium();
      try {
        await cloudService.signIn(cleanEmail, cleanPassword);
        setIsLoading(false);
        setIsDone(true);
        setTimeout(navigateToApp, 700);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Invalid email or password.');
      }
    } else if (authMode === 'signup') {
      if (!cleanPassword || cleanPassword.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      setIsLoading(true);
      hapticFeedback.medium();
      try {
        const data = await cloudService.signUp(cleanEmail, cleanPassword, name.trim() || 'Musify Listener');
        setIsLoading(false);
        if (data.session) {
          setIsDone(true);
          setTimeout(navigateToApp, 700);
        } else {
          setSuccessInfo('Account created! Enter the confirmation code sent to your email.');
          setAuthMode('verify_signup');
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Failed to create account.');
      }
    } else if (authMode === 'verify_signup') {
      const cleanOtp = otpCode.trim();
      if (!cleanOtp) {
        setErrorMessage('Please enter the confirmation code from your email.');
        return;
      }
      setIsLoading(true);
      hapticFeedback.medium();
      try {
        await cloudService.verifySignupOtp(cleanEmail, cleanOtp);
        setIsLoading(false);
        setIsDone(true);
        setTimeout(navigateToApp, 700);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Invalid confirmation code. Please check and try again.');
      }
    } else if (authMode === 'forgot') {
      setIsLoading(true);
      hapticFeedback.medium();
      try {
        await cloudService.resetPasswordForEmail(cleanEmail);
        setIsLoading(false);
        setSuccessInfo('Password recovery email sent! Check your inbox for the code.');
        setAuthMode('verify_reset');
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Unable to send recovery email.');
      }
    } else if (authMode === 'verify_reset') {
      const cleanOtp = otpCode.trim();
      const cleanNewPass = newPassword.trim();
      if (!cleanOtp) {
        setErrorMessage('Please enter the recovery code from your email.');
        return;
      }
      if (!cleanNewPass || cleanNewPass.length < 6) {
        setErrorMessage('New password must be at least 6 characters.');
        return;
      }

      setIsLoading(true);
      hapticFeedback.medium();
      try {
        await cloudService.verifyRecoveryOtp(cleanEmail, cleanOtp);
        await cloudService.updatePassword(cleanNewPass);
        setIsLoading(false);
        setIsDone(true);
        setTimeout(navigateToApp, 700);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Invalid recovery code. Please check and try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Monochromatic Background Artwork */}
      <View style={styles.backgroundArtworkWrap}>
        <Image
          source={require('../../../assets/tour/tour_equalizer.jpg')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.backgroundDarkVeil} />
      </View>

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Row */}
            <View style={styles.topHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (authMode !== 'signin') {
                    setAuthMode('signin');
                    setErrorMessage('');
                    setSuccessInfo('');
                  } else {
                    (navigation as any).goBack();
                  }
                }}
                style={styles.backBtn}
              >
                <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.backBtnWash} />
                <ArrowLeft size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.authLockBadge}>
                <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.badgeGlassWash} />
                <ShieldCheck size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.authLockBadgeText}>Supabase Verified</Text>
              </View>
            </View>

            {/* Monochromatic Form Container */}
            <View style={styles.formContainer}>
              {/* Soundwave Logo */}
              <View style={styles.logoRow}>
                <View style={styles.logoCircleGlass}>
                  <Image
                    source={require('../../../assets/musify_logo.png')}
                    style={styles.logoAppIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.logoTitle}>MUSIFY</Text>
              </View>

              {/* Clean Headlines */}
              <Text style={styles.formHeading}>
                {authMode === 'signin' && 'Welcome Back'}
                {authMode === 'signup' && 'Create Account'}
                {authMode === 'verify_signup' && 'Verify Email'}
                {authMode === 'forgot' && 'Reset Password'}
                {authMode === 'verify_reset' && 'Recovery Code'}
              </Text>

              <Text style={styles.formSubtitle}>
                {authMode === 'signin' &&
                  'Sign in to synchronize playlists, liked tracks, and AI music discovery across devices.'}
                {authMode === 'signup' &&
                  'Unlock 320 kbps streaming, studio EQ acoustics, and personal cloud backup.'}
                {authMode === 'verify_signup' &&
                  'Enter the confirmation code sent to your email address to activate your account.'}
                {authMode === 'forgot' &&
                  "Enter your registered email address to receive a recovery code."}
                {authMode === 'verify_reset' &&
                  'Enter the recovery code from your email and choose your new password below.'}
              </Text>

              {/* Notifications */}
              {!!successInfo && (
                <View style={styles.successBanner}>
                  <CheckCircle2 size={15} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.successBannerText}>{successInfo}</Text>
                </View>
              )}

              {!!errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {/* Monochromatic Frosted Inputs */}
              <View style={styles.inputsBlock}>
                {authMode === 'signup' && (
                  <View style={styles.inputWrapper}>
                    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.inputGlassWash} />
                    <User size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Full Name"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={name}
                      onChangeText={setName}
                      style={styles.textInput}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={styles.inputGlassWash} />
                  <Mail size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Email address"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={authMode !== 'verify_reset'}
                    style={styles.textInput}
                  />
                </View>

                {(authMode === 'signin' || authMode === 'signup') && (
                  <View style={styles.inputWrapper}>
                    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.inputGlassWash} />
                    <Lock size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      style={styles.textInput}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color="rgba(255,255,255,0.5)" />
                      ) : (
                        <Eye size={18} color="rgba(255,255,255,0.5)" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {authMode === 'verify_reset' && (
                  <>
                    <View style={styles.inputWrapper}>
                      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                      <View style={styles.inputGlassWash} />
                      <KeyRound size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter Recovery Code"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="number-pad"
                        maxLength={10}
                        style={styles.textInput}
                      />
                    </View>

                    <View style={styles.inputWrapper}>
                      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                      <View style={styles.inputGlassWash} />
                      <Lock size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Enter New Password"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        style={styles.textInput}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        {showPassword ? (
                          <EyeOff size={18} color="rgba(255,255,255,0.5)" />
                        ) : (
                          <Eye size={18} color="rgba(255,255,255,0.5)" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {authMode === 'verify_signup' && (
                  <View style={styles.inputWrapper}>
                    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.inputGlassWash} />
                    <KeyRound size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter Confirmation Code"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                      maxLength={10}
                      style={styles.textInput}
                    />
                  </View>
                )}
              </View>

              {/* Resend Action */}
              {authMode === 'verify_signup' && (
                <TouchableOpacity
                  onPress={async () => {
                    hapticFeedback.light();
                    try {
                      setIsLoading(true);
                      await cloudService.resendSignupEmail(email.trim());
                      setIsLoading(false);
                      setSuccessInfo('Verification email resent! Check your inbox.');
                    } catch (e: any) {
                      setIsLoading(false);
                      setErrorMessage(e.message || 'Failed to resend email.');
                    }
                  }}
                  style={styles.forgotBtn}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <RotateCcw size={12} color="#FFFFFF" />
                    <Text style={styles.forgotBtnText}>Resend confirmation code</Text>
                  </View>
                </TouchableOpacity>
              )}

              {authMode === 'signin' && (
                <TouchableOpacity
                  onPress={() => {
                    hapticFeedback.light();
                    setErrorMessage('');
                    setSuccessInfo('');
                    setAuthMode('forgot');
                  }}
                  style={styles.forgotBtn}
                >
                  <Text style={styles.forgotBtnText}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              {/* Encryption Status Pill */}
              <View style={styles.aiSyncBadge}>
                <Database size={12} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.aiSyncBadgeText}>
                  Encrypted PostgreSQL Session • Musify Cloud
                </Text>
              </View>

              {/* Pure White Monochromatic Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleAuthAction}
                disabled={isLoading || isDone}
                style={styles.submitBtn}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : isDone ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={18} color="#000000" />
                    <Text style={styles.submitBtnText}>Connected</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.submitBtnText}>
                      {authMode === 'signin' && 'Sign In'}
                      {authMode === 'signup' && 'Create Account'}
                      {authMode === 'verify_signup' && 'Verify & Activate'}
                      {authMode === 'forgot' && 'Send Code'}
                      {authMode === 'verify_reset' && 'Confirm & Reset'}
                    </Text>
                    <ArrowRight size={16} color="#000000" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Mode Toggles */}
              {authMode === 'signin' && (
                <TouchableOpacity
                  onPress={() => {
                    hapticFeedback.selection();
                    setErrorMessage('');
                    setSuccessInfo('');
                    setAuthMode('signup');
                  }}
                  style={styles.toggleRow}
                >
                  <Text style={styles.toggleText}>
                    Don't have an account?{' '}
                    <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Create One</Text>
                  </Text>
                </TouchableOpacity>
              )}

              {authMode === 'signup' && (
                <TouchableOpacity
                  onPress={() => {
                    hapticFeedback.selection();
                    setErrorMessage('');
                    setSuccessInfo('');
                    setAuthMode('signin');
                  }}
                  style={styles.toggleRow}
                >
                  <Text style={styles.toggleText}>
                    Already registered?{' '}
                    <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              )}

              {(authMode === 'forgot' || authMode === 'verify_reset' || authMode === 'verify_signup') && (
                <TouchableOpacity
                  onPress={() => {
                    hapticFeedback.selection();
                    setErrorMessage('');
                    setSuccessInfo('');
                    setAuthMode('signin');
                  }}
                  style={styles.toggleRow}
                >
                  <Text style={styles.toggleText}>
                    Return to <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  safeArea: {
    flex: 1,
    zIndex: 10,
  },
  backgroundArtworkWrap: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  backgroundDarkVeil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 30,
    zIndex: 10,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  backBtnWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  authLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  badgeGlassWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  authLockBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  formContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  logoCircleGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  logoAppIcon: {
    width: 22,
    height: 22,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  formHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 14,
  },
  successBannerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  errorBanner: {
    width: '100%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputsBlock: {
    width: '100%',
    gap: 12,
    marginBottom: 10,
  },
  inputWrapper: {
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
  },
  inputGlassWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 8,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  forgotBtnText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  aiSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 18,
  },
  aiSyncBadgeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '600',
  },
  submitBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF', // High contrast pure white button
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000', // Crisp black text on pure white button
    letterSpacing: 0.2,
  },
  toggleRow: {
    marginTop: 18,
    paddingVertical: 10,
  },
  toggleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
  },
});
