import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/authStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const SPORTS = [
  { id: 'All', label: 'All', icon: 'apps-outline' },
  { id: 'Badminton', label: 'Badminton', icon: 'tennisball-outline' },
  { id: 'Cricket', label: 'Cricket', icon: 'baseball-outline' }
];

export default function HomeScreen() {
  const router = useRouter();
  const { selectedSport, setSelectedSport, venues, setVenues } = useStore();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVenues();
  }, [selectedSport]);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const sportQuery = selectedSport === 'All' ? '' : selectedSport;
      const response = await axios.get(
        `${BACKEND_URL}/api/venues${sportQuery ? `?sport=${sportQuery}` : ''}`
      );
      setVenues(response.data);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = venues.filter((venue) =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0A0F1E', '#1a1f35', '#0A0F1E']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2', '#f093fb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="flash" size={28} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>
                {user?.name ? `Hi, ${user.name}!` : 'ClashON'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {user?.name ? 'Ready to play?' : 'Book Your Game'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color="#8b9dc3" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search venues or location..."
              placeholderTextColor="#4a5568"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Sport Filters - Compact Pills */}
        <View style={styles.filterRow}>
          {SPORTS.map((sport) => {
            const isSelected = selectedSport === sport.id;
            return (
              <TouchableOpacity
                key={sport.id}
                onPress={() => setSelectedSport(sport.id)}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.filterPill}
                  >
                    <Ionicons name={sport.icon.replace('-outline', '')} size={16} color="#fff" />
                    <Text style={styles.filterTextActive}>{sport.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterPillInactive}>
                    <Ionicons name={sport.icon} size={16} color="#8b9dc3" />
                    <Text style={styles.filterTextInactive}>{sport.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Venues List */}
        <ScrollView 
          style={styles.venuesList} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.venuesContent}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
            </View>
          ) : filteredVenues.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="basketball-outline" size={64} color="#4a5568" />
              <Text style={styles.emptyText}>No venues found</Text>
              <Text style={styles.emptySubtext}>Try a different search or filter</Text>
            </View>
          ) : (
            filteredVenues.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={styles.venueCard}
                onPress={() => router.push(`/venue/${venue.id}`)}
              >
                {/* Venue Image */}
                <View style={styles.venueImageContainer}>
                  {venue.image ? (
                    <Image
                      source={{ uri: venue.image }}
                      style={styles.venueImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.venueImage, styles.venueImagePlaceholder]}>
                      <Ionicons name="basketball-outline" size={40} color="#4a5568" />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(10, 15, 30, 0.9)']}
                    style={styles.imageGradient}
                  />
                  {venue.smart_recording && (
                    <View style={styles.smartBadge}>
                      <LinearGradient
                        colors={['#f093fb', '#f5576c']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.smartBadgeGradient}
                      >
                        <Ionicons name="videocam" size={12} color="#fff" />
                        <Text style={styles.smartBadgeText}>ClashON Video</Text>
                      </LinearGradient>
                    </View>
                  )}
                </View>

                {/* Venue Info */}
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <View style={styles.venueMetaRow}>
                    <Ionicons name="location-outline" size={14} color="#8b9dc3" />
                    <Text style={styles.venueLocation}>{venue.location}</Text>
                  </View>
                  <View style={styles.venueBottomRow}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.venueRating}>{venue.rating}</Text>
                    </View>
                    <View style={styles.sportBadge}>
                      <Text style={styles.sportBadgeText}>{venue.sport}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceValue}>₹{venue.base_price}</Text>
                      <Text style={styles.priceLabel}>/hr</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8b9dc3',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f5576c',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  filterPillInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  filterTextActive: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextInactive: {
    color: '#8b9dc3',
    fontSize: 12,
    fontWeight: '600',
  },
  venuesList: {
    flex: 1,
  },
  venuesContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8b9dc3',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 4,
  },
  venueCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  venueImageContainer: {
    position: 'relative',
    height: 200,
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  venueImagePlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  smartBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  smartBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  smartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  venueInfo: {
    padding: 16,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  venueLocation: {
    fontSize: 13,
    color: '#8b9dc3',
    flex: 1,
  },
  venueBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueRating: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  sportBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sportBadgeText: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#667eea',
  },
  priceLabel: {
    fontSize: 12,
    color: '#8b9dc3',
    marginLeft: 2,
  },
});
