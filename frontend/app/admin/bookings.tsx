import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Booking {
  id: string;
  venue_id: string;
  venue_name: string;
  date: string;
  time_slot: string;
  sport: string;
  super_video_enabled: boolean;
  total_price: number;
  user_id: string;
  user_name: string;
  pin_code: string;
  status: string;
  video_status: string;
}

type FilterType = 'all' | 'confirmed' | 'completed' | 'cancelled';

export default function AdminBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      const url = filter === 'all'
        ? `${BACKEND_URL}/api/admin/bookings`
        : `${BACKEND_URL}/api/admin/bookings?status=${filter}`;
      const response = await axios.get(url);
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchBookings();
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const updateStatus = async (booking: Booking, newStatus: string) => {
    try {
      await axios.put(`${BACKEND_URL}/api/admin/bookings/${booking.id}`, { status: newStatus });
      fetchBookings();
      Alert.alert('Success', `Booking ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = (booking: Booking) => {
    Alert.alert(
      'Delete Booking',
      `Delete booking for ${booking.user_name} at ${booking.venue_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/admin/bookings/${booking.id}`);
              setBookings(bookings.filter(b => b.id !== booking.id));
              Alert.alert('Success', 'Booking deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete booking');
            }
          },
        },
      ]
    );
  };

  const openDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsModal(true);
  };

  const filters: { key: FilterType; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: '#667eea' },
    { key: 'confirmed', label: 'Confirmed', color: '#f59e0b' },
    { key: 'completed', label: 'Completed', color: '#10b981' },
    { key: 'cancelled', label: 'Cancelled', color: '#dc2626' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'cancelled': return '#dc2626';
      default: return '#f59e0b';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0A0F1E', '#1a1f35', '#0A0F1E']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0F1E', '#1a1f35', '#0A0F1E']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bookings</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{bookings.length}</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, filter === f.key && { backgroundColor: f.color }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
          }
        >
          {bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#4a5568" />
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          ) : (
            bookings.map((booking) => (
              <TouchableOpacity key={booking.id} style={styles.bookingCard} onPress={() => openDetails(booking)}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.venueName}>{booking.venue_name}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="person" size={12} color="#8b9dc3" />
                      <Text style={styles.metaText}>{booking.user_name}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {booking.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={14} color="#667eea" />
                    <Text style={styles.detailText}>{booking.date}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={14} color="#667eea" />
                    <Text style={styles.detailText}>{booking.time_slot}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.priceText}>₹{booking.total_price}</Text>
                  </View>
                </View>

                <View style={styles.bookingFooter}>
                  <View style={styles.pinBox}>
                    <Text style={styles.pinLabel}>PIN</Text>
                    <Text style={styles.pinCode}>{booking.pin_code}</Text>
                  </View>
                  {booking.super_video_enabled && (
                    <View style={styles.videoBadge}>
                      <Ionicons name="videocam" size={12} color="#f59e0b" />
                      <Text style={styles.videoText}>Super Video</Text>
                    </View>
                  )}
                </View>

                {/* Quick Actions */}
                <View style={styles.cardActions}>
                  {booking.status === 'confirmed' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.completeBtn]}
                        onPress={() => updateStatus(booking, 'completed')}
                      >
                        <Ionicons name="checkmark" size={16} color="#10b981" />
                        <Text style={[styles.actionText, { color: '#10b981' }]}>Complete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.cancelBtn]}
                        onPress={() => updateStatus(booking, 'cancelled')}
                      >
                        <Ionicons name="close" size={16} color="#dc2626" />
                        <Text style={[styles.actionText, { color: '#dc2626' }]}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(booking)}>
                    <Ionicons name="trash" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Details Modal */}
        <Modal visible={detailsModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient colors={['#1a1f35', '#0A0F1E']} style={StyleSheet.absoluteFill} />
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Booking Details</Text>
                <TouchableOpacity onPress={() => setDetailsModal(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {selectedBooking && (
                <ScrollView style={styles.modalScroll}>
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Venue</Text>
                    <Text style={styles.sectionValue}>{selectedBooking.venue_name}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Customer</Text>
                    <Text style={styles.sectionValue}>{selectedBooking.user_name}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailCol}>
                      <Text style={styles.sectionLabel}>Date</Text>
                      <Text style={styles.sectionValue}>{selectedBooking.date}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.sectionLabel}>Time</Text>
                      <Text style={styles.sectionValue}>{selectedBooking.time_slot}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailCol}>
                      <Text style={styles.sectionLabel}>Sport</Text>
                      <Text style={styles.sectionValue}>{selectedBooking.sport}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.sectionLabel}>Status</Text>
                      <Text style={[styles.sectionValue, { color: getStatusColor(selectedBooking.status) }]}>
                        {selectedBooking.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailCol}>
                      <Text style={styles.sectionLabel}>Amount</Text>
                      <Text style={[styles.sectionValue, { color: '#10b981' }]}>₹{selectedBooking.total_price}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.sectionLabel}>PIN Code</Text>
                      <Text style={[styles.sectionValue, styles.pinDisplay]}>{selectedBooking.pin_code}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Super Video</Text>
                    <Text style={styles.sectionValue}>
                      {selectedBooking.super_video_enabled ? 'Yes - ' + selectedBooking.video_status : 'No'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Booking ID</Text>
                    <Text style={[styles.sectionValue, { fontSize: 12, color: '#8b9dc3' }]}>
                      {selectedBooking.id}
                    </Text>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safeArea: { flex: 1 },
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  countBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filterContainer: { paddingHorizontal: 20, marginBottom: 16 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  filterText: { color: '#8b9dc3', fontSize: 14, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { color: '#8b9dc3', fontSize: 16, marginTop: 16 },
  bookingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: { flex: 1 },
  venueName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { color: '#8b9dc3', fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  bookingDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: '#fff', fontSize: 13 },
  priceText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pinBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pinLabel: { color: '#8b9dc3', fontSize: 12 },
  pinCode: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoText: { color: '#f59e0b', fontSize: 11, fontWeight: '500' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeBtn: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  cancelBtn: { backgroundColor: 'rgba(220, 38, 38, 0.15)' },
  actionText: { fontSize: 13, fontWeight: '600' },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1a1f35',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  modalScroll: { padding: 20 },
  detailSection: { marginBottom: 20 },
  detailRow: { flexDirection: 'row', marginBottom: 20 },
  detailCol: { flex: 1 },
  sectionLabel: { color: '#8b9dc3', fontSize: 12, marginBottom: 4 },
  sectionValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pinDisplay: { letterSpacing: 3, fontSize: 20 },
});
