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
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Venue {
  id: string;
  name: string;
  location: string;
  address?: string;
  sport: string;
  image?: string;
  rating: number;
  base_price: number;
  super_video_price: number;
  smart_recording: boolean;
  amenities: string[];
  description?: string;
  contact_phone?: string;
  contact_email?: string;
  is_active: boolean;
}

const defaultVenue = {
  name: '',
  location: '',
  address: '',
  sport: 'Badminton',
  rating: 4.5,
  base_price: 500,
  super_video_price: 200,
  smart_recording: true,
  amenities: [],
  description: '',
  contact_phone: '',
  contact_email: '',
};

export default function AdminVenues() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState(defaultVenue);
  const [saving, setSaving] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');

  const fetchVenues = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/venues`);
      setVenues(response.data);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVenues();
  };

  const openCreateModal = () => {
    setEditingVenue(null);
    setFormData(defaultVenue);
    setModalVisible(true);
  };

  const openEditModal = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      location: venue.location,
      address: venue.address || '',
      sport: venue.sport,
      rating: venue.rating,
      base_price: venue.base_price,
      super_video_price: venue.super_video_price,
      smart_recording: venue.smart_recording,
      amenities: venue.amenities || [],
      description: venue.description || '',
      contact_phone: venue.contact_phone || '',
      contact_email: venue.contact_email || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.location.trim()) {
      Alert.alert('Error', 'Name and location are required');
      return;
    }

    setSaving(true);
    try {
      if (editingVenue) {
        await axios.put(`${BACKEND_URL}/api/admin/venues/${editingVenue.id}`, formData);
        Alert.alert('Success', 'Venue updated successfully');
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/venues`, formData);
        Alert.alert('Success', 'Venue created successfully');
      }
      setModalVisible(false);
      fetchVenues();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save venue');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (venue: Venue) => {
    Alert.alert(
      'Delete Venue',
      `Are you sure you want to delete "${venue.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/admin/venues/${venue.id}`);
              setVenues(venues.filter(v => v.id !== venue.id));
              Alert.alert('Success', 'Venue deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete venue');
            }
          },
        },
      ]
    );
  };

  const toggleVenueStatus = async (venue: Venue) => {
    try {
      await axios.put(`${BACKEND_URL}/api/admin/venues/${venue.id}`, {
        is_active: !venue.is_active
      });
      fetchVenues();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const addAmenity = () => {
    if (amenityInput.trim()) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput.trim()]
      });
      setAmenityInput('');
    }
  };

  const removeAmenity = (index: number) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== index)
    });
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
          <Text style={styles.headerTitle}>Venues</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
          }
        >
          {venues.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={64} color="#4a5568" />
              <Text style={styles.emptyText}>No venues found</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Text style={styles.emptyButtonText}>Add First Venue</Text>
              </TouchableOpacity>
            </View>
          ) : (
            venues.map((venue) => (
              <TouchableOpacity key={venue.id} style={styles.venueCard} onPress={() => openEditModal(venue)}>
                <View style={styles.venueHeader}>
                  <View style={styles.venueInfo}>
                    <Text style={styles.venueName}>{venue.name}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={14} color="#8b9dc3" />
                      <Text style={styles.venueLocation}>{venue.location}</Text>
                    </View>
                  </View>
                  <View style={styles.venueActions}>
                    <View style={[styles.sportBadge, venue.sport === 'Cricket' && styles.cricketBadge]}>
                      <Text style={styles.sportText}>{venue.sport}</Text>
                    </View>
                    <View style={[styles.statusBadge, !venue.is_active && styles.inactiveBadge]}>
                      <Text style={styles.statusText}>{venue.is_active ? 'Active' : 'Inactive'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.venueStats}>
                  <View style={styles.stat}>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={styles.statText}>{venue.rating}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.priceText}>₹{venue.base_price}/hr</Text>
                  </View>
                  {venue.smart_recording && (
                    <View style={styles.recordingBadge}>
                      <Ionicons name="videocam" size={12} color="#10b981" />
                      <Text style={styles.recordingText}>Recording</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => toggleVenueStatus(venue)}>
                    <Ionicons name={venue.is_active ? "pause" : "play"} size={18} color="#667eea" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(venue)}>
                    <Ionicons name="pencil" size={18} color="#f59e0b" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(venue)}>
                    <Ionicons name="trash" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
                <Text style={styles.modalTitle}>{editingVenue ? 'Edit Venue' : 'New Venue'}</Text>
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
                  placeholder="Venue name"
                  placeholderTextColor="#4a5568"
                />

                <Text style={styles.label}>Location *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => setFormData({...formData, location: text})}
                  placeholder="City or area"
                  placeholderTextColor="#4a5568"
                />

                <Text style={styles.label}>Full Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({...formData, address: text})}
                  placeholder="Complete address"
                  placeholderTextColor="#4a5568"
                  multiline
                />

                <Text style={styles.label}>Sport</Text>
                <View style={styles.sportSelector}>
                  {['Badminton', 'Cricket', 'Tennis', 'Football'].map((sport) => (
                    <TouchableOpacity
                      key={sport}
                      style={[styles.sportOption, formData.sport === sport && styles.sportOptionActive]}
                      onPress={() => setFormData({...formData, sport})}
                    >
                      <Text style={[styles.sportOptionText, formData.sport === sport && styles.sportOptionTextActive]}>
                        {sport}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Base Price (₹/hr)</Text>
                    <TextInput
                      style={styles.input}
                      value={String(formData.base_price)}
                      onChangeText={(text) => setFormData({...formData, base_price: Number(text) || 0})}
                      keyboardType="numeric"
                      placeholder="500"
                      placeholderTextColor="#4a5568"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Super Video (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={String(formData.super_video_price)}
                      onChangeText={(text) => setFormData({...formData, super_video_price: Number(text) || 0})}
                      keyboardType="numeric"
                      placeholder="200"
                      placeholderTextColor="#4a5568"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Rating</Text>
                    <TextInput
                      style={styles.input}
                      value={String(formData.rating)}
                      onChangeText={(text) => setFormData({...formData, rating: Number(text) || 4.5})}
                      keyboardType="decimal-pad"
                      placeholder="4.5"
                      placeholderTextColor="#4a5568"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Smart Recording</Text>
                    <View style={styles.switchRow}>
                      <Switch
                        value={formData.smart_recording}
                        onValueChange={(value) => setFormData({...formData, smart_recording: value})}
                        trackColor={{ false: '#4a5568', true: '#10b981' }}
                      />
                      <Text style={styles.switchLabel}>{formData.smart_recording ? 'Yes' : 'No'}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Contact Phone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contact_phone}
                  onChangeText={(text) => setFormData({...formData, contact_phone: text})}
                  placeholder="Phone number"
                  placeholderTextColor="#4a5568"
                  keyboardType="phone-pad"
                />

                <Text style={styles.label}>Contact Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contact_email}
                  onChangeText={(text) => setFormData({...formData, contact_email: text})}
                  placeholder="Email address"
                  placeholderTextColor="#4a5568"
                  keyboardType="email-address"
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({...formData, description: text})}
                  placeholder="Venue description"
                  placeholderTextColor="#4a5568"
                  multiline
                />

                <Text style={styles.label}>Amenities</Text>
                <View style={styles.amenityInput}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={amenityInput}
                    onChangeText={setAmenityInput}
                    placeholder="Add amenity"
                    placeholderTextColor="#4a5568"
                  />
                  <TouchableOpacity style={styles.addAmenityBtn} onPress={addAmenity}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.amenitiesList}>
                  {formData.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityTag}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                      <TouchableOpacity onPress={() => removeAmenity(index)}>
                        <Ionicons name="close" size={14} color="#8b9dc3" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                  <LinearGradient colors={['#f59e0b', '#dc2626']} style={styles.saveGradient}>
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>{editingVenue ? 'Update Venue' : 'Create Venue'}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { color: '#8b9dc3', fontSize: 16, marginTop: 16 },
  emptyButton: {
    marginTop: 20,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: { color: '#fff', fontWeight: '600' },
  venueCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  venueHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  venueInfo: { flex: 1 },
  venueName: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  venueLocation: { color: '#8b9dc3', fontSize: 13 },
  venueActions: { alignItems: 'flex-end', gap: 6 },
  sportBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cricketBadge: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  sportText: { color: '#667eea', fontSize: 11, fontWeight: '600' },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  inactiveBadge: { backgroundColor: 'rgba(220, 38, 38, 0.2)' },
  statusText: { color: '#10b981', fontSize: 11, fontWeight: '600' },
  venueStats: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  priceText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  recordingText: { color: '#10b981', fontSize: 11, fontWeight: '500' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
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
    maxHeight: '90%',
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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  sportSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  sportOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sportOptionActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  sportOptionText: { color: '#8b9dc3', fontSize: 13, fontWeight: '500' },
  sportOptionTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  switchLabel: { color: '#fff', fontSize: 14 },
  amenityInput: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addAmenityBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenitiesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  amenityText: { color: '#667eea', fontSize: 13 },
  saveButton: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  saveGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
