// app/trip-detail/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getDistrictImage } from '../../constants/DistrictImages';
import { getImageUrl } from '../../constants/Storage';
import { supabase } from '../../lib/supabase';

interface Place {
  id: string;
  name: string;
  category: string;
  rating: number;
  image_path?: string;
}

interface TimeSlot {
  place: Place;
  startTime: string;
  endTime: string;
  type: 'attraction' | 'dining' | 'travel';
}

interface DayPlan {
  day: number;
  date: Date;
  slots: TimeSlot[];
}

interface Trip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  attractions: any;
  district_name?: string;
  district_image?: any;
  accommodation?: {
    id: string;
    name: string;
    type: string;
    image_path?: string;
    price_per_night: number;
    rating: number;
  };
}

export default function TripDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);

  useEffect(() => {
    loadTripDetails();
  }, [id]);

  const loadTripDetails = async () => {
    try {
      // Get trip details
      const { data: tripData, error: tripError } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (tripError) throw tripError;

      // Get district info
      const districtId = tripData.districts?.[0];
      const { data: districtData } = await supabase
        .from('districts')
        .select('name, name_ms')
        .eq('id', districtId)
        .single();

      // Get accommodations for this district
      const { data: accommodationsData } = await supabase
        .from('accommodations')
        .select('*')
        .eq('district_id', districtId)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(3);

      setTrip({
        ...tripData,
        district_name: districtData?.name || 'Unknown',
        district_image: getDistrictImage(districtData?.name || ''),
      });

      setAccommodations(accommodationsData || []);
    } catch (error) {
      console.error('Error loading trip:', error);
      Alert.alert('Error', 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handleOptions = () => {
    Alert.alert(
      'Trip Options',
      'Choose an action',
      [
        {
          text: 'Save Trip',
          onPress: () => handleSaveTrip(),
        },
        {
          text: 'Delete Trip',
          onPress: () => handleDeleteTrip(),
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSaveTrip = async () => {
    try {
      const { error } = await supabase
        .from('travel_plans')
        .update({ status: 'saved' })
        .eq('id', id);

      if (error) throw error;
      Alert.alert('Success', 'Trip saved successfully');
      loadTripDetails();
    } catch (error) {
      Alert.alert('Error', 'Failed to save trip');
    }
  };

  const handleDeleteTrip = async () => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('travel_plans')
                .delete()
                .eq('id', id);

              if (error) throw error;
              Alert.alert('Success', 'Trip deleted');
              router.replace('/(tabs)/my-trips');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete trip');
            }
          },
        },
      ]
    );
  };

  const handlePlacePress = (placeId: string) => {
    // TODO: Navigate to place detail page
    console.log('Navigate to place:', placeId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    );
  }

  const itinerary = trip.attractions?.days || [];

  return (
    <View style={styles.container}>
      {/* Header with District Image */}
      <View style={styles.imageHeader}>
        <Image
          source={trip.district_image || require('../../assets/images/icon.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
        
        {/* Back and Options Buttons */}
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOptions} style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Trip Info Overlay */}
        <View style={styles.headerOverlay}>
          <Text style={styles.districtName}>{trip.district_name}</Text>
          <Text style={styles.tripDates}>
            {format(parseISO(trip.start_date), 'MMM dd')} - {format(parseISO(trip.end_date), 'MMM dd, yyyy')}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Recommended Accommodation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Accommodation</Text>
          
          {accommodations.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accommodationsScroll}
            >
              {accommodations.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={styles.accommodationCard}
                  activeOpacity={0.9}
                >
                  <Image
                    source={
                      acc.image_path
                        ? { uri: getImageUrl(acc.image_path) }
                        : trip.district_image
                    }
                    style={styles.accommodationImage}
                    resizeMode="cover"
                  />
                  <View style={styles.accommodationInfo}>
                    <Text style={styles.accommodationName} numberOfLines={1}>
                      {acc.name}
                    </Text>
                    <Text style={styles.accommodationType}>{acc.type}</Text>
                    <View style={styles.accommodationDetails}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.ratingText}>{acc.rating}</Text>
                      </View>
                      <Text style={styles.priceText}>RM {acc.price_per_night}/night</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.notAvailable}>
              <Text style={styles.notAvailableText}>Not available</Text>
            </View>
          )}
        </View>

        {/* Day Selector */}
        {itinerary.length > 0 && (
          <View style={styles.daySelector}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daySelectorScroll}
            >
              {itinerary.map((day: DayPlan) => (
                <TouchableOpacity
                  key={day.day}
                  style={[
                    styles.dayButton,
                    selectedDay === day.day && styles.dayButtonActive,
                  ]}
                  onPress={() => setSelectedDay(day.day)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      selectedDay === day.day && styles.dayButtonTextActive,
                    ]}
                  >
                    Day {day.day}
                  </Text>
                  <Text
                    style={[
                      styles.dayButtonDate,
                      selectedDay === day.day && styles.dayButtonDateActive,
                    ]}
                  >
                    {format(new Date(day.date), 'EEE dd')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Daily Itinerary */}
        {itinerary.length > 0 ? (
          <View style={styles.section}>
            {itinerary
              .find((d: DayPlan) => d.day === selectedDay)
              ?.slots.filter((slot: TimeSlot) => slot.type !== 'travel')
              .map((slot: TimeSlot, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.placeCard}
                  onPress={() => handlePlacePress(slot.place.id)}
                  activeOpacity={0.9}
                >
                  {/* Timeline indicator */}
                  <View style={styles.timeline}>
                    <View style={styles.timelineDot} />
                    {index < itinerary.find((d: DayPlan) => d.day === selectedDay).slots.filter((s: TimeSlot) => s.type !== 'travel').length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>

                  {/* Time */}
                  <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <Text style={styles.timeText}>
                      {format(new Date(slot.startTime), 'HH:mm')} - {format(new Date(slot.endTime), 'HH:mm')}
                    </Text>
                  </View>

                  {/* Place Card */}
                  <View style={styles.placeCardContent}>
                    <Image
                      source={
                        slot.place.image_path
                          ? { uri: getImageUrl(slot.place.image_path) }
                          : trip.district_image
                      }
                      style={styles.placeImage}
                      resizeMode="cover"
                    />

                    <View style={styles.placeInfo}>
                      <Text style={styles.placeName} numberOfLines={2}>
                        {slot.place.name}
                      </Text>
                      <View style={styles.placeDetails}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{slot.place.category}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={14} color="#f59e0b" />
                          <Text style={styles.ratingText}>{slot.place.rating}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        ) : (
          <View style={styles.noItinerary}>
            <Text style={styles.noItineraryText}>No itinerary available</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
  },
  
  // Header
  imageHeader: {
    height: 250,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerButtons: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  districtName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  tripDates: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },

  // Accommodations
  accommodationsScroll: {
    paddingRight: 20,
  },
  accommodationCard: {
    width: 240,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accommodationImage: {
    width: '100%',
    height: 140,
  },
  accommodationInfo: {
    padding: 12,
  },
  accommodationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  accommodationType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  accommodationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  notAvailable: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  notAvailableText: {
    fontSize: 16,
    color: '#9ca3af',
  },

  // Day Selector
  daySelector: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  daySelectorScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  dayButtonActive: {
    backgroundColor: '#10b981',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  dayButtonTextActive: {
    color: 'white',
  },
  dayButtonDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  dayButtonDateActive: {
    color: 'rgba(255,255,255,0.9)',
  },

  // Place Cards
  placeCard: {
    marginBottom: 20,
    position: 'relative',
    paddingLeft: 40,
  },
  timeline: {
    position: 'absolute',
    left: 12,
    top: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 2,
  },
  timelineLine: {
    width: 2,
    height: 140,
    backgroundColor: '#d1d5db',
    marginTop: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  placeCardContent: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeImage: {
    width: 100,
    height: 100,
  },
  placeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  placeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  noItinerary: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noItineraryText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});