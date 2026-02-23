import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useAdminAuthStore } from '../store/adminAuthStore';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const adminLogin = useAdminAuthStore((state) => state.adminLogin);
  
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'name' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const otpInputs = useRef<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleContinue = async () => {
    if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();
      // Check if this is an admin phone
      const checkResponse = await axios.post(`${BACKEND_URL}/api/auth/check-user-type`, {
        phone: phone,
      });

      if (checkResponse.data.user_type === 'admin') {
        // This is an admin - send admin OTP directly
        setIsAdmin(true);
        setName(checkResponse.data.name || 'Admin');
        await sendAdminOTP();
      } else if (checkResponse.data.user_type === 'user') {
        // Existing user - go directly to OTP
        setIsAdmin(false);
        setName(checkResponse.data.name);
        await sendUserOTP();
      } else {
        // New user - need name first
        setIsAdmin(false);
        setStep('name');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const sendAdminOTP = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/auth/request-otp`, {
        phone: phone,
      });

      if (response.data.success) {
        setSessionId(response.data.session_id);
        Alert.alert(
          'Admin OTP Sent!',
          `Welcome back! A 6-digit OTP has been sent to ${phone}`,
          [{ text: 'OK', onPress: () => setStep('otp') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send OTP');
    }
  };

  const sendUserOTP = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/request-otp`, {
        phone: phone,
      });

      if (response.data.success) {
        if (response.data.is_admin) {
          // Backend detected admin - switch to admin flow
          setIsAdmin(true);
          await sendAdminOTP();
          return;
        }
        setSessionId(response.data.session_id);
        Alert.alert(
          'OTP Sent!',
          `A 6-digit OTP has been sent to ${phone}`,
          [{ text: 'OK', onPress: () => setStep('otp') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send OTP. Please try again.');
    }
  };

  const handleRequestOTP = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();
      await sendUserOTP();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      if (isAdmin) {
        // Admin verification
        const response = await axios.post(`${BACKEND_URL}/api/admin/auth/verify-otp`, {
          phone: phone,
          otp: otpString,
        });

        // Save admin to auth store
        adminLogin(response.data.admin);
        
        // Show welcome message and redirect to admin dashboard
        Alert.alert(
          'Welcome Admin!',
          `Hi ${response.data.admin.name}! You're logged in as ${response.data.admin.role}.`,
          [{ text: 'Go to Dashboard', onPress: () => router.replace('/admin/dashboard') }]
        );
      } else {
        // Regular user verification
        const response = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, {
          phone: phone,
          otp: otpString,
          name: name,
        });

        // Save user to auth store
        login(response.data.user);
        
        // Show welcome message
        Alert.alert(
          'Welcome to ClashON!',
          `Hi ${name}! You're all set to book courts and capture glory.`,
          [{ text: 'Get Started', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all 6 digits are entered
    if (value && index === 5) {
      const fullOtp = [...newOtp];
      fullOtp[index] = value;
      if (fullOtp.every(d => d !== '')) {
        Keyboard.dismiss();
      }
    }
  };

  const handleBackspace = (index: number) => {
    if (otp[index] === '' && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        await sendAdminOTP();
      } else {
        await sendUserOTP();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0F1E', '#1a1f35', '#0A0F1E']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={isAdmin ? ['#f59e0b', '#dc2626', '#7c3aed'] : ['#667eea', '#764ba2', '#f093fb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Ionicons name={isAdmin ? "shield-checkmark" : "flash"} size={48} color="#fff" />
              </LinearGradient>
              <Text style={styles.appName}>{isAdmin ? 'ClashON Admin' : 'ClashON'}</Text>
              <Text style={styles.tagline}>{isAdmin ? 'Management Portal' : 'Book Courts. Capture Glory.'}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {step === 'phone' ? (
                <>
                  <Text style={styles.title}>Welcome!</Text>
                  <Text style={styles.subtitle}>
                    Enter your phone number to get started
                  </Text>

                  <View style={styles.inputContainer}>
                    <View style={styles.phoneInputWrapper}>
                      <Text style={styles.countryCode}>+91</Text>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Phone Number"
                        placeholderTextColor="#4a5568"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleContinue}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Continue</Text>
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : step === 'name' ? (
                <>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setStep('phone')}
                  >
                    <Ionicons name="arrow-back" size={24} color="#8b9dc3" />
                  </TouchableOpacity>

                  <Text style={styles.title}>What's your name?</Text>
                  <Text style={styles.subtitle}>
                    We'll use this to personalize your experience
                  </Text>

                  <View style={styles.inputContainer}>
                    <View style={styles.phoneInputWrapper}>
                      <Ionicons name="person-outline" size={20} color="#8b9dc3" style={{ marginRight: 12 }} />
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Your Name"
                        placeholderTextColor="#4a5568"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleRequestOTP}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Send OTP</Text>
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      setStep('phone');
                      setIsAdmin(false);
                      setOtp(['', '', '', '', '', '']);
                    }}
                  >
                    <Ionicons name="arrow-back" size={24} color="#8b9dc3" />
                  </TouchableOpacity>

                  <Text style={styles.title}>{isAdmin ? 'Verify Admin OTP' : 'Verify OTP'}</Text>
                  <Text style={styles.subtitle}>
                    Enter the 6-digit code sent to {phone}
                  </Text>

                  {isAdmin && (
                    <View style={styles.adminBadge}>
                      <Ionicons name="shield-checkmark" size={16} color="#f59e0b" />
                      <Text style={styles.adminBadgeText}>Admin Login</Text>
                    </View>
                  )}

                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (otpInputs.current[index] = ref)}
                        style={[
                          styles.otpInput,
                          digit && (isAdmin ? styles.otpInputFilledAdmin : styles.otpInputFilled),
                        ]}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={({ nativeEvent }) => {
                          if (nativeEvent.key === 'Backspace') {
                            handleBackspace(index);
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendOTP}
                    disabled={loading}
                  >
                    <Text style={[styles.resendText, isAdmin && styles.resendTextAdmin]}>Resend OTP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={isAdmin ? ['#f59e0b', '#dc2626'] : ['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.buttonText}>Verify & Continue</Text>
                          <Ionicons name={isAdmin ? "shield-checkmark" : "checkmark-circle"} size={20} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {isAdmin ? 'Authorized Personnel Only' : 'By continuing, you agree to our Terms & Privacy Policy'}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    color: '#8b9dc3',
  },
  content: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8b9dc3',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 20,
    alignSelf: 'center',
  },
  adminBadgeText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 48,
    height: 54,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  otpInputFilled: {
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  otpInputFilledAdmin: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  resendTextAdmin: {
    color: '#f59e0b',
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#4a5568',
    textAlign: 'center',
  },
});
