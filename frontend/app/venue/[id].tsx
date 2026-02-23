import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { format, addDays } from 'date-fns';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function VenueDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  useEffect(() => {
    loadVenue();
  }, [id]);

  const loadVenue = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/venues/${id}`);
      setVenue(response.data);
    } catch (error) {
      console.error('Error loading venue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };

  const handleBookNow = () => {
    if (!selectedSlot) {
      alert('Please select a time slot');
      return;
    }

    router.push({
      pathname: '/checkout',
      params: {
        venue_id: venue.id,
        venue_name: venue.name,
        sport: venue.sport,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time_slot: selectedSlot.time,
        base_price: venue.base_price,
        super_video_price: venue.super_video_price,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Venue not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          {venue.image ? (
            <Image source={{ uri: venue.image }} style={styles.headerImage} />
          ) : (
            <View style={[styles.headerImage, styles.placeholderImage]}>
              <Ionicons name="basketball" size={60} color="#6b7280" />
            </View>
          )}
          
          {/* Back Button */}
          <SafeAreaView style={styles.headerOverlay}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          {venue.smart_recording && (
            <View style={styles.recordingBadge}>
              <Ionicons name="videocam" size={16} color="#fff" />
              <Text style={styles.recordingBadgeText}>Smart Recording</Text>
            </View>
          )}
        </View>

        {/* Venue Info */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.venueName}>{venue.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={18} color="#fbbf24" />
              <Text style={styles.rating}>{venue.rating}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location" size={16} color="#9ca3af" />
            <Text style={styles.location}>{venue.location}</Text>
          </View>

          <View style={styles.sportBadge}>
            <Ionicons
              name={venue.sport === 'Badminton' ? 'tennisball' : 'baseball'}
              size={14}
              color="#10b981"
            />
            <Text style={styles.sportText}>{venue.sport}</Text>
          </View>

          {/* Amenities */}
          {venue.amenities && venue.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {venue.amenities.map((amenity: string, index: number) => (
                  <View key={index} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Date Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dateScroller}
            >
              {getDates().map((date, index) => {
                const isSelected =
                  format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateChip,
                      isSelected && styles.dateChipSelected,
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      style={[
                        styles.dateDay,
                        isSelected && styles.dateDaySelected,
                      ]}
                    >
                      {format(date, 'EEE')}
                    </Text>
                    <Text
                      style={[
                        styles.dateNumber,
                        isSelected && styles.dateNumberSelected,
                      ]}
                    >
                      {format(date, 'd')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Time Slots */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Slots</Text>
            <View style={styles.slotsGrid}>
              {venue.slots.map((slot: any, index: number) => {
                const isSelected = selectedSlot?.time === slot.time;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.slotChip,
                      !slot.available && styles.slotDisabled,
                      isSelected && styles.slotSelected,
                    ]}
                    onPress={() => slot.available && setSelectedSlot(slot)}
                    disabled={!slot.available}
                  >
                    <Text
                      style={[
                        styles.slotTime,
                        !slot.available && styles.slotTimeDisabled,
                        isSelected && styles.slotTimeSelected,
                      ]}
                    >
                      {slot.time}
                    </Text>
                    <Text
                      style={[
                        styles.slotPrice,
                        !slot.available && styles.slotPriceDisabled,
                        isSelected && styles.slotPriceSelected,
                      ]}
                    >
                      ₹{slot.price}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.priceValue}>₹{venue.base_price}/hr</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            !selectedSlot && styles.bookButtonDisabled,
          ]}
          onPress={handleBookNow}
          disabled={!selectedSlot}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A0F1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  placeholderImage: {
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  venueName: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  rating: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  location: {
    color: '#9ca3af',
    fontSize: 14,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 24,
  },
  sportText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  amenityText: {
    color: '#d1d5db',
    fontSize: 13,
  },
  dateScroller: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateChip: {
    width: 70,
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  dateChipSelected: {
    backgroundColor: '#10b981',
  },
  dateDay: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  dateDaySelected: {
    color: '#fff',
  },
  dateNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dateNumberSelected: {
    color: '#fff',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotChip: {
    width: '30%',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  slotDisabled: {
    opacity: 0.3,
  },
  slotTime: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  slotTimeSelected: {
    color: '#fff',
  },
  slotTimeDisabled: {
    color: '#6b7280',
  },
  slotPrice: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 4,
  },
  slotPriceSelected: {
    color: '#fff',
  },
  slotPriceDisabled: {
    color: '#6b7280',
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
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  priceValue: {
    color: '#10b981',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
