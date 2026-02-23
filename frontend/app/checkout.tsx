import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  
  const [superVideoEnabled, setSuperVideoEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const basePrice = parseFloat(params.base_price as string);
  const superVideoPrice = parseFloat(params.super_video_price as string);
  const totalPrice = basePrice + (superVideoEnabled ? superVideoPrice : 0);

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Mock payment - in real app, integrate Razorpay/Stripe here
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create booking
      const bookingData = {
        venue_id: params.venue_id,
        venue_name: params.venue_name,
        date: params.date,
        time_slot: params.time_slot,
        sport: params.sport,
        super_video_enabled: superVideoEnabled,
        total_price: totalPrice,
        user_id: user?.id || '',
        user_name: user?.name || 'Guest User',
      };

      const response = await axios.post(
        `${BACKEND_URL}/api/bookings`,
        bookingData
      );

      // Navigate to success screen
      router.replace({
        pathname: '/booking-success',
        params: {
          booking_id: response.data.id,
          pin_code: response.data.pin_code,
          super_video: superVideoEnabled.toString(),
        },
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Booking Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Venue</Text>
                <Text style={styles.summaryValue}>{params.venue_name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sport</Text>
                <Text style={styles.summaryValue}>{params.sport}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>{params.date}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>{params.time_slot}</Text>
              </View>
            </View>
          </View>

          {/* Super Video Toggle */}
          <View style={styles.section}>
            <View style={styles.superVideoCard}>
              <View style={styles.superVideoHeader}>
                <View style={styles.superVideoIcon}>
                  <Ionicons name="videocam" size={24} color="#fff" />
                </View>
                <View style={styles.superVideoInfo}>
                  <Text style={styles.superVideoTitle}>Add Super Video</Text>
                  <Text style={styles.superVideoDescription}>
                    Get AI-powered 30-60s highlight reel with graphics & animations
                  </Text>
                </View>
                <Switch
                  value={superVideoEnabled}
                  onValueChange={setSuperVideoEnabled}
                  trackColor={{ false: '#374151', true: '#10b981' }}
                  thumbColor={superVideoEnabled ? '#fff' : '#9ca3af'}
                />
              </View>

              {superVideoEnabled && (
                <View style={styles.superVideoFeatures}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>15s action clips</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>Neon ball tracer</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>Super shot animations</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>Scoreboard outro</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Price Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Details</Text>
            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Court Booking</Text>
                <Text style={styles.priceValue}>₹{basePrice}</Text>
              </View>
              {superVideoEnabled && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Super Video</Text>
                  <Text style={styles.priceValue}>₹{superVideoPrice}</Text>
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{totalPrice}</Text>
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentCard}>
              <View style={styles.paymentOption}>
                <View style={styles.paymentIconContainer}>
                  <Ionicons name="card" size={24} color="#10b981" />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentTitle}>Mock Payment</Text>
                  <Text style={styles.paymentDescription}>
                    Simulated payment for demo
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomPriceContainer}>
            <Text style={styles.bottomPriceLabel}>Total</Text>
            <Text style={styles.bottomPriceValue}>₹{totalPrice}</Text>
          </View>
          <TouchableOpacity
            style={[styles.payButton, loading && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.payButtonText}>Pay Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  superVideoCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#374151',
  },
  superVideoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  superVideoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  superVideoInfo: {
    flex: 1,
  },
  superVideoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  superVideoDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    lineHeight: 16,
  },
  superVideoFeatures: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#d1d5db',
    fontSize: 13,
  },
  priceCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  priceValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 8,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  paymentDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2937',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPriceLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  bottomPriceValue: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  payButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
