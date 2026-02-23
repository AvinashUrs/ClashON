import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { height } = Dimensions.get('window');

export default function FlexFeedScreen() {
  const router = useRouter();
  const { videos, setVideos } = useStore();
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/videos`);
      setVideos(response.data);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (videoId: string) => {
    try {
      await axios.put(`${BACKEND_URL}/api/videos/${videoId}/like`);
      // Update local state
      setVideos(
        videos.map((v) =>
          v.id === videoId ? { ...v, likes: v.likes + 1 } : v
        )
      );
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="play-circle" size={80} color="#4b5563" />
          <Text style={styles.emptyText}>No videos yet</Text>
          <Text style={styles.emptySubtext}>
            Book a court with Super Video to see highlights here!
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.exploreButtonText}>Explore Venues</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.y / (height - 60)
          );
          setCurrentIndex(index);
        }}
      >
        {videos.map((video, index) => (
          <View key={video.id} style={styles.videoContainer}>
            {/* Video Player Placeholder */}
            <View style={styles.videoPlayer}>
              <Ionicons name="play-circle" size={80} color="rgba(255,255,255,0.8)" />
              <Text style={styles.videoPlaceholder}>Super Video Highlight</Text>
              <Text style={styles.videoDuration}>{video.duration}s</Text>
            </View>

            {/* Video Info Overlay */}
            <View style={styles.videoOverlay}>
              {/* Right Side Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleLike(video.id)}
                >
                  <Ionicons name="heart" size={32} color="#fff" />
                  <Text style={styles.actionText}>{video.likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble" size={28} color="#fff" />
                  <Text style={styles.actionText}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-social" size={28} color="#fff" />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Info */}
              <View style={styles.bottomInfo}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={20} color="#fff" />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{video.user_name}</Text>
                    <Text style={styles.venueNameText}>{video.venue_name}</Text>
                  </View>
                </View>

                <View style={styles.videoMetaRow}>
                  <View style={styles.sportBadge}>
                    <Ionicons
                      name={video.sport === 'Badminton' ? 'tennisball' : 'baseball'}
                      size={12}
                      color="#10b981"
                    />
                    <Text style={styles.sportText}>{video.sport}</Text>
                  </View>
                  <View style={styles.viewsContainer}>
                    <Ionicons name="eye" size={14} color="#9ca3af" />
                    <Text style={styles.viewsText}>{video.views} views</Text>
                  </View>
                </View>

                {/* Book This Court CTA */}
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Ionicons name="calendar" size={18} color="#fff" />
                  <Text style={styles.bookButtonText}>Book this Court</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Flex Feed</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{videos.length} Videos</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0F1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8b9dc3',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoContainer: {
    height: height - 60,
    position: 'relative',
  },
  videoPlayer: {
    flex: 1,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  videoDuration: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  actionsContainer: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  bottomInfo: {
    padding: 16,
    paddingBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  venueNameText: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 2,
  },
  videoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  sportText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  bookButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
});
