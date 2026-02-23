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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  created_at: string;
}

interface UserStats {
  user: User;
  total_bookings: number;
  completed_bookings: number;
  total_spent: number;
  total_videos: number;
  recent_bookings: any[];
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create/Edit Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  
  // Stats Modal
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [selectedUserStats, setSelectedUserStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchUsers = async (search?: string) => {
    try {
      const url = search 
        ? `${BACKEND_URL}/api/admin/users?search=${encodeURIComponent(search)}`
        : `${BACKEND_URL}/api/admin/users`;
      const response = await axios.get(url);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery) {
        fetchUsers(searchQuery);
      } else {
        fetchUsers();
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(searchQuery);
  };

  const fetchUserStats = async (userId: string) => {
    setLoadingStats(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/users/${userId}/stats`);
      setSelectedUserStats(response.data);
      setStatsModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch user stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', phone: '', email: '' });
    setModalVisible(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      email: user.email || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }

    if (formData.phone.length !== 10) {
      Alert.alert('Error', 'Phone number must be 10 digits');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        await axios.put(`${BACKEND_URL}/api/admin/users/${editingUser.id}`, formData);
        Alert.alert('Success', 'User updated successfully');
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/users`, formData);
        Alert.alert('Success', 'User created successfully');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${user.name}"?\nThis will also delete all their bookings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/admin/users/${user.id}`);
              setUsers(users.filter(u => u.id !== user.id));
              Alert.alert('Success', 'User deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  if (loading) {
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
          <Text style={styles.headerTitle}>Users</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8b9dc3" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, or email"
            placeholderTextColor="#4a5568"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8b9dc3" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
          }
        >
          {users.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#4a5568" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No users found' : 'No users yet'}
              </Text>
            </View>
          ) : (
            users.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <TouchableOpacity style={styles.userMain} onPress={() => fetchUserStats(user.id)}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase() || 'U'}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name || 'Unnamed User'}</Text>
                    <View style={styles.userDetails}>
                      <Ionicons name="call" size={12} color="#8b9dc3" />
                      <Text style={styles.userPhone}>+91 {user.phone}</Text>
                    </View>
                    {user.email && (
                      <View style={styles.userDetails}>
                        <Ionicons name="mail" size={12} color="#8b9dc3" />
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#4a5568" />
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => fetchUserStats(user.id)}>
                    <Ionicons name="stats-chart" size={18} color="#667eea" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(user)}>
                    <Ionicons name="pencil" size={18} color="#f59e0b" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(user)}>
                    <Ionicons name="trash" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Create/Edit Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient colors={['#1a1f35', '#0A0F1E']} style={StyleSheet.absoluteFill} />
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingUser ? 'Edit User' : 'New User'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  placeholder="Full name"
                  placeholderTextColor="#4a5568"
                />

                <Text style={styles.label}>Phone *</Text>
                <View style={styles.phoneInputWrapper}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({...formData, phone: text.replace(/\D/g, '')})}
                    placeholder="10-digit phone"
                    placeholderTextColor="#4a5568"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  placeholder="Email address"
                  placeholderTextColor="#4a5568"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                  <LinearGradient colors={['#f59e0b', '#dc2626']} style={styles.saveGradient}>
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>{editingUser ? 'Update User' : 'Create User'}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Stats Modal */}
        <Modal visible={statsModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient colors={['#1a1f35', '#0A0F1E']} style={StyleSheet.absoluteFill} />
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>User Details</Text>
                <TouchableOpacity onPress={() => setStatsModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {selectedUserStats && (
                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                  <View style={styles.statsProfile}>
                    <View style={styles.statsAvatar}>
                      <Text style={styles.statsAvatarText}>
                        {selectedUserStats.user.name?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <Text style={styles.statsName}>{selectedUserStats.user.name || 'Unnamed'}</Text>
                    <Text style={styles.statsPhone}>+91 {selectedUserStats.user.phone}</Text>
                    {selectedUserStats.user.email && (
                      <Text style={styles.statsEmail}>{selectedUserStats.user.email}</Text>
                    )}
                  </View>

                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxValue}>{selectedUserStats.total_bookings}</Text>
                      <Text style={styles.statBoxLabel}>Total Bookings</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxValue}>{selectedUserStats.completed_bookings}</Text>
                      <Text style={styles.statBoxLabel}>Completed</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxValue}>₹{selectedUserStats.total_spent}</Text>
                      <Text style={styles.statBoxLabel}>Total Spent</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxValue}>{selectedUserStats.total_videos}</Text>
                      <Text style={styles.statBoxLabel}>Videos</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitle}>Recent Bookings</Text>
                  {selectedUserStats.recent_bookings?.length > 0 ? (
                    selectedUserStats.recent_bookings.map((booking: any, index: number) => (
                      <View key={index} style={styles.bookingItem}>
                        <View style={styles.bookingMain}>
                          <Text style={styles.bookingVenue}>{booking.venue_name}</Text>
                          <Text style={styles.bookingDetails}>
                            {booking.date} • {booking.time_slot}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.bookingPrice}>₹{booking.total_price}</Text>
                          <View style={[styles.bookingStatus, 
                            booking.status === 'completed' && styles.statusCompleted,
                            booking.status === 'cancelled' && styles.statusCancelled
                          ]}>
                            <Text style={styles.bookingStatusText}>{booking.status}</Text>
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noBookings}>No bookings yet</Text>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>

      {loadingStats && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      )}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { color: '#8b9dc3', fontSize: 16, marginTop: 16 },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  userMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#667eea', fontSize: 20, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  userDetails: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  userPhone: { color: '#8b9dc3', fontSize: 13 },
  userEmail: { color: '#8b9dc3', fontSize: 13 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1a1f35',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
  label: { color: '#8b9dc3', fontSize: 13, marginBottom: 8, fontWeight: '500' },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryCode: { fontSize: 15, fontWeight: '600', color: '#fff', marginRight: 8 },
  phoneInput: { flex: 1, paddingVertical: 14, color: '#fff', fontSize: 15 },
  saveButton: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  saveGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statsProfile: { alignItems: 'center', marginBottom: 24 },
  statsAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsAvatarText: { color: '#667eea', fontSize: 32, fontWeight: 'bold' },
  statsName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statsPhone: { fontSize: 14, color: '#8b9dc3', marginTop: 4 },
  statsEmail: { fontSize: 13, color: '#667eea', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statBox: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statBoxValue: { fontSize: 24, fontWeight: 'bold', color: '#f59e0b' },
  statBoxLabel: { fontSize: 12, color: '#8b9dc3', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  bookingMain: { flex: 1 },
  bookingVenue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  bookingDetails: { fontSize: 12, color: '#8b9dc3', marginTop: 2 },
  bookingPrice: { fontSize: 14, fontWeight: '600', color: '#10b981', textAlign: 'right' },
  bookingStatus: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusCompleted: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  statusCancelled: { backgroundColor: 'rgba(220, 38, 38, 0.2)' },
  bookingStatusText: { fontSize: 10, color: '#f59e0b', fontWeight: '600', textTransform: 'capitalize' },
  noBookings: { color: '#4a5568', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
