import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { useStore } from '../../store/useStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function BookingsScreen() {
  const { bookings, setBookings } = useStore();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed'>('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BACKEND_URL}/api/bookings?user_id=${user?.id}`
      );
      setBookings(response.data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#3b82f6';
      case 'completed':
        return '#667eea';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getVideoStatusText = (videoStatus: string) => {
    switch (videoStatus) {
      case 'pending':
        return 'Video not started';
      case 'processing':
        return 'Processing highlight...';
      case 'ready':
        return 'Video ready!';
      default:
        return 'No video';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity onPress={loadBookings}>
          <Ionicons name="refresh" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'confirmed' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('confirmed')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'confirmed' && styles.filterTabTextActive,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'completed' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'completed' && styles.filterTabTextActive,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.bookingsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bookingsContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar" size={64} color="#4b5563" />
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Text style={styles.emptySubtext}>
              Book your first court to get started!
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(booking.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {booking.status.toUpperCase()}
                </Text>
              </View>

              {/* Venue Info */}
              <View style={styles.bookingHeader}>
                <View style={styles.venueIcon}>
                  <Ionicons
                    name={booking.sport === 'Badminton' ? 'tennisball' : 'baseball'}
                    size={24}
                    color="#667eea"
                  />
                </View>
                <View style={styles.venueDetails}>
                  <Text style={styles.venueName}>{booking.venue_name}</Text>
                  <Text style={styles.sportText}>{booking.sport}</Text>
                </View>
              </View>

              {/* Booking Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color="#9ca3af" />
                  <Text style={styles.detailText}>{booking.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color="#9ca3af" />
                  <Text style={styles.detailText}>{booking.time_slot}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="cash" size={16} color="#9ca3af" />
                  <Text style={styles.detailText}>₹{booking.total_price}</Text>
                </View>
              </View>

              {/* PIN Code */}
              {booking.status === 'confirmed' && (
                <View style={styles.pinContainer}>
                  <Text style={styles.pinLabel}>Access PIN:</Text>
                  <Text style={styles.pinCode}>{booking.pin_code}</Text>
                </View>
              )}

              {/* Super Video Status */}
              {booking.super_video_enabled && (
                <View style={styles.videoStatusContainer}>
                  <Ionicons
                    name="videocam"
                    size={16}
                    color={booking.video_status === 'ready' ? '#667eea' : '#fbbf24'}
                  />
                  <Text
                    style={[
                      styles.videoStatusText,
                      booking.video_status === 'ready' && styles.videoReadyText,
                    ]}
                  >
                    {getVideoStatusText(booking.video_status)}
                  </Text>
                  {booking.video_status === 'ready' && (
                    <TouchableOpacity style={styles.watchButton}>
                      <Text style={styles.watchButtonText}>Watch</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterTabActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterTabText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  bookingsList: {
    flex: 1,
  },
  bookingsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  bookingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  venueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  venueDetails: {
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sportText: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  pinContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pinLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  pinCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
    letterSpacing: 2,
  },
  videoStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  videoStatusText: {
    flex: 1,
    fontSize: 13,
    color: '#fbbf24',
    fontWeight: '600',
  },
  videoReadyText: {
    color: '#667eea',
  },
  watchButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  watchButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
