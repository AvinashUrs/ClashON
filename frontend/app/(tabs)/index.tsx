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
  LinearGradient,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useStore } from '../../store/useStore';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const SPORTS = [
  { id: 'All', label: 'All Sports', icon: 'flame' },
  { id: 'Badminton', label: 'Badminton', icon: 'tennisball' },
  { id: 'Cricket', label: 'Cricket', icon: 'baseball' }
];

export default function HomeScreen() {
  const router = useRouter();
  const { selectedSport, setSelectedSport, venues, setVenues } = useStore();
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CourtBook</Text>
        <Text style={styles.headerSubtitle}>Find & Book Courts</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search venues..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Sport Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {SPORTS.map((sport) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.filterChip,
              selectedSport === sport && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSport(sport)}
          >
            <Text
              style={[
                styles.filterText,
                selectedSport === sport && styles.filterTextActive,
              ]}
            >
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Venues List */}
      <ScrollView style={styles.venuesList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : filteredVenues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="basketball" size={64} color="#4b5563" />
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
                  />
                ) : (
                  <View style={[styles.venueImage, styles.venueImagePlaceholder]}>
                    <Ionicons name="basketball" size={40} color="#6b7280" />
                  </View>
                )}
                {venue.smart_recording && (
                  <View style={styles.smartBadge}>
                    <Ionicons name="videocam" size={12} color="#fff" />
                    <Text style={styles.smartBadgeText}>Smart Recording</Text>
                  </View>
                )}
              </View>

              {/* Venue Info */}
              <View style={styles.venueInfo}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <View style={styles.venueMetaRow}>
                  <Ionicons name="location" size={14} color="#9ca3af" />
                  <Text style={styles.venueLocation}>{venue.location}</Text>
                </View>
                <View style={styles.venueMetaRow}>
                  <Ionicons name="star" size={14} color="#fbbf24" />
                  <Text style={styles.venueRating}>{venue.rating}</Text>
                  <View style={styles.sportBadge}>
                    <Text style={styles.sportBadgeText}>{venue.sport}</Text>
                  </View>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Starting at</Text>
                  <Text style={styles.priceValue}>₹{venue.base_price}/hr</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#10b981',
  },
  filterText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  venuesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  venueCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  venueImageContainer: {
    position: 'relative',
  },
  venueImage: {
    width: '100%',
    height: 180,
  },
  venueImagePlaceholder: {
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smartBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  venueLocation: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 4,
  },
  venueRating: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 4,
    marginRight: 12,
  },
  sportBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sportBadgeText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  priceLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
});
