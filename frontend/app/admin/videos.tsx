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

interface Video {
  id: string;
  booking_id?: string;
  venue_name: string;
  sport: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  video_url?: string;
  duration: number;
  likes: number;
  views: number;
  user_id: string;
  user_name: string;
  is_featured: boolean;
  is_public: boolean;
}

export default function AdminVideos() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState({
    venue_name: '',
    sport: 'Badminton',
    title: '',
    description: '',
    duration: 45,
    user_id: '',
    user_name: '',
    is_featured: false,
    is_public: true,
  });
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/videos`);
      setVideos(response.data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const openCreateModal = () => {
    setEditingVideo(null);
    setFormData({
      venue_name: '',
      sport: 'Badminton',
      title: '',
      description: '',
      duration: 45,
      user_id: users[0]?.id || '',
      user_name: users[0]?.name || '',
      is_featured: false,
      is_public: true,
    });
    setModalVisible(true);
  };

  const openEditModal = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      venue_name: video.venue_name,
      sport: video.sport,
      title: video.title || '',
      description: video.description || '',
      duration: video.duration,
      user_id: video.user_id,
      user_name: video.user_name,
      is_featured: video.is_featured,
      is_public: video.is_public,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.venue_name.trim() || !formData.user_id) {
      Alert.alert('Error', 'Venue name and user are required');
      return;
    }

    setSaving(true);
    try {
      if (editingVideo) {
        await axios.put(`${BACKEND_URL}/api/admin/videos/${editingVideo.id}`, {
          title: formData.title,
          description: formData.description,
          is_featured: formData.is_featured,
          is_public: formData.is_public,
        });
        Alert.alert('Success', 'Video updated');
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/videos`, formData);
        Alert.alert('Success', 'Video created');
      }
      setModalVisible(false);
      fetchVideos();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (video: Video) => {
    Alert.alert(
      'Delete Video',
      `Delete video by ${video.user_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/admin/videos/${video.id}`);
              setVideos(videos.filter(v => v.id !== video.id));
              Alert.alert('Success', 'Video deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete video');
            }
          },
        },
      ]
    );
  };

  const toggleFeatured = async (video: Video) => {
    try {
      await axios.put(`${BACKEND_URL}/api/admin/videos/${video.id}`, {
        is_featured: !video.is_featured,
      });
      fetchVideos();
    } catch (error) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const togglePublic = async (video: Video) => {
    try {
      await axios.put(`${BACKEND_URL}/api/admin/videos/${video.id}`, {
        is_public: !video.is_public,
      });
      fetchVideos();
    } catch (error) {
      Alert.alert('Error', 'Failed to update');
    }
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
          <Text style={styles.headerTitle}>Videos</Text>
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
          {videos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="videocam-outline" size={64} color="#4a5568" />
              <Text style={styles.emptyText}>No videos yet</Text>
              <Text style={styles.emptySubtext}>Videos will appear when users generate highlights</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Text style={styles.emptyButtonText}>Add Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            videos.map((video) => (
              <TouchableOpacity key={video.id} style={styles.videoCard} onPress={() => openEditModal(video)}>
                <View style={styles.thumbnailContainer}>
                  <View style={styles.thumbnailPlaceholder}>
                    <Ionicons name="play-circle" size={40} color="#4a5568" />
                  </View>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{video.duration}s</Text>
                  </View>
                  {video.is_featured && (
                    <View style={styles.featuredBadge}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                    </View>
                  )}
                </View>

                <View style={styles.videoContent}>
                  <View style={styles.videoHeader}>
                    <View style={styles.userInfo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{video.user_name?.[0]?.toUpperCase() || 'U'}</Text>
                      </View>
                      <View>
                        <Text style={styles.userName}>{video.user_name}</Text>
                        <Text style={styles.venueName}>{video.venue_name}</Text>
                      </View>
                    </View>
                    <View style={[styles.sportBadge, video.sport === 'Cricket' && styles.cricketBadge]}>
                      <Text style={styles.sportText}>{video.sport}</Text>
                    </View>
                  </View>

                  {video.title && <Text style={styles.videoTitle}>{video.title}</Text>}

                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <Ionicons name="eye" size={14} color="#8b9dc3" />
                      <Text style={styles.statText}>{video.views}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Ionicons name="heart" size={14} color="#dc2626" />
                      <Text style={styles.statText}>{video.likes}</Text>
                    </View>
                    <View style={[styles.visibilityBadge, !video.is_public && styles.privateBadge]}>
                      <Ionicons name={video.is_public ? 'globe' : 'lock-closed'} size={12} color={video.is_public ? '#10b981' : '#f59e0b'} />
                      <Text style={[styles.visibilityText, !video.is_public && styles.privateText]}>
                        {video.is_public ? 'Public' : 'Private'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => toggleFeatured(video)}>
                      <Ionicons name={video.is_featured ? 'star' : 'star-outline'} size={18} color="#f59e0b" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => togglePublic(video)}>
                      <Ionicons name={video.is_public ? 'globe' : 'lock-closed'} size={18} color="#667eea" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(video)}>
                      <Ionicons name="pencil" size={18} color="#f59e0b" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(video)}>
                      <Ionicons name="trash" size={18} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
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
                <Text style={styles.modalTitle}>{editingVideo ? 'Edit Video' : 'New Video'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {!editingVideo && (
                  <>
                    <Text style={styles.label}>Venue Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.venue_name}
                      onChangeText={(text) => setFormData({...formData, venue_name: text})}
                      placeholder="Venue name"
                      placeholderTextColor="#4a5568"
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

                    <Text style={styles.label}>User *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userSelector}>
                      {users.map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          style={[styles.userOption, formData.user_id === user.id && styles.userOptionActive]}
                          onPress={() => setFormData({...formData, user_id: user.id, user_name: user.name})}
                        >
                          <Text style={styles.userOptionText}>{user.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.label}>Duration (seconds)</Text>
                    <TextInput
                      style={styles.input}
                      value={String(formData.duration)}
                      onChangeText={(text) => setFormData({...formData, duration: Number(text) || 45})}
                      keyboardType="numeric"
                      placeholder="45"
                      placeholderTextColor="#4a5568"
                    />
                  </>
                )}

                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({...formData, title: text})}
                  placeholder="Video title"
                  placeholderTextColor="#4a5568"
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({...formData, description: text})}
                  placeholder="Description"
                  placeholderTextColor="#4a5568"
                  multiline
                />

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Featured Video</Text>
                  <Switch
                    value={formData.is_featured}
                    onValueChange={(value) => setFormData({...formData, is_featured: value})}
                    trackColor={{ false: '#4a5568', true: '#f59e0b' }}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Public (show in Flex Feed)</Text>
                  <Switch
                    value={formData.is_public}
                    onValueChange={(value) => setFormData({...formData, is_public: value})}
                    trackColor={{ false: '#4a5568', true: '#10b981' }}
                  />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                  <LinearGradient colors={['#f59e0b', '#dc2626']} style={styles.saveGradient}>
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>{editingVideo ? 'Update Video' : 'Create Video'}</Text>
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
  emptyText: { color: '#8b9dc3', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtext: { color: '#4a5568', fontSize: 14, marginTop: 8, textAlign: 'center' },
  emptyButton: {
    marginTop: 20,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: { color: '#fff', fontWeight: '600' },
  videoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  thumbnailContainer: { position: 'relative' },
  thumbnailPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    padding: 6,
    borderRadius: 8,
  },
  videoContent: { padding: 16 },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#667eea', fontSize: 14, fontWeight: 'bold' },
  userName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  venueName: { fontSize: 12, color: '#8b9dc3', marginTop: 1 },
  sportBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cricketBadge: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  sportText: { color: '#667eea', fontSize: 12, fontWeight: '600' },
  videoTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 8 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: '#8b9dc3', fontSize: 13 },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  privateBadge: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  visibilityText: { color: '#10b981', fontSize: 11, fontWeight: '500' },
  privateText: { color: '#f59e0b' },
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
  userSelector: { marginBottom: 16 },
  userOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userOptionActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  userOptionText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchLabel: { color: '#fff', fontSize: 15 },
  saveButton: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  saveGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
