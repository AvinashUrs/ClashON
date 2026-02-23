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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAdminAuthStore } from '../store/adminAuthStore';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminLoginScreen() {
  const router = useRouter();
  const adminLogin = useAdminAuthStore((state) => state.adminLogin);
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const otpInputs = useRef<any[]>([]);

  const handleRequestOTP = async () => {
    if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/api/admin/auth/request-otp`, {
        phone: phone,
      });

      if (response.data.success) {
        setSessionId(response.data.session_id);
        Alert.alert(
          'Admin OTP Sent!',
          `A 6-digit OTP has been sent to ${phone}`,
          [{ text: 'OK', onPress: () => setStep('otp') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send OTP');
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
      const response = await axios.post(`${BACKEND_URL}/api/admin/auth/verify-otp`, {
        phone: phone,
        otp: otpString,
      });

      // Save admin to auth store
      adminLogin(response.data.admin);
      
      // Show welcome message
      Alert.alert(
        'Welcome Admin!',
        `Hi ${response.data.admin.name}! You're logged in as ${response.data.admin.role}.`,
        [{ text: 'Continue', onPress: () => router.replace('/admin/dashboard') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Invalid OTP or not authorized as admin');
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

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (otp[index] === '' && index > 0) {
      otpInputs.current[index - 1]?.focus();
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
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#f59e0b', '#dc2626', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="shield-checkmark" size={48} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>ClashON Admin</Text>
            <Text style={styles.tagline}>Management Portal</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {step === 'phone' ? (
              <>
                <Text style={styles.title}>Admin Login</Text>
                <Text style={styles.subtitle}>
                  Enter your admin phone number to continue
                </Text>

                <View style={styles.inputContainer}>
                  <View style={styles.phoneInputWrapper}>
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Admin Phone Number"
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
                  onPress={handleRequestOTP}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#dc2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Send Admin OTP</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Back to User Login */}
                <TouchableOpacity
                  style={styles.backToUserButton}
                  onPress={() => router.replace('/login')}
                >
                  <Text style={styles.backToUserText}>← Back to User Login</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep('phone')}
                >
                  <Ionicons name="arrow-back" size={24} color="#8b9dc3" />
                </TouchableOpacity>

                <Text style={styles.title}>Verify Admin OTP</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit code sent to {phone}
                </Text>

                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (otpInputs.current[index] = ref)}
                      style={[
                        styles.otpInput,
                        digit && styles.otpInputFilled,
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
                  onPress={handleRequestOTP}
                >
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#dc2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Verify & Login</Text>
                        <Ionicons name="shield-checkmark" size={20} color="#fff" />
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
              Authorized Personnel Only
            </Text>
          </View>
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
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8b9dc3',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 32,
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 50,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  otpInputFilled: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 'auto',
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
  backToUserButton: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  backToUserText: {
    color: '#8b9dc3',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '600',
  },
});
