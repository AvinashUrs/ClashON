import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function BookingSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleViewBooking = () => {
    router.replace('/(tabs)/bookings');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Animation */}
        <Animated.View
          style={[
            styles.successCircle,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons name="checkmark" size={64} color="#fff" />
        </Animated.View>

        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your court has been successfully booked
        </Text>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="ticket" size={20} color="#10b981" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Booking ID</Text>
              <Text style={styles.detailValue}>
                {(params.booking_id as string)?.slice(0, 8).toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="key" size={20} color="#10b981" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Access PIN</Text>
              <Text style={styles.pinCode}>{params.pin_code}</Text>
            </View>
          </View>

          {params.super_video === 'true' && (
            <>
              <View style={styles.divider} />
              <View style={styles.superVideoInfo}>
                <View style={styles.videoIcon}>
                  <Ionicons name="videocam" size={20} color="#fff" />
                </View>
                <View style={styles.videoContent}>
                  <Text style={styles.videoTitle}>Super Video Added!</Text>
                  <Text style={styles.videoDescription}>
                    Your highlight reel will be ready shortly after your game
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Use the PIN code to access the court 5 minutes before your slot
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewBooking}
          >
            <Text style={styles.primaryButtonText}>View Booking</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoHome}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pinCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    letterSpacing: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 16,
  },
  superVideoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContent: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
  infoBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#93c5fd',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  secondaryButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
});
