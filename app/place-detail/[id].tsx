// app/place-detail/[id].tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { getImageUrl } from '../../constants/Storage';
import { getDistrictImage } from '../../constants/DistrictImages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Place {
  id: string;
  name: string;
  description: string;
  district_id: string;
  district_name?: string;
  image_path: string | null;
  rating: number;
  category: string;
  tags: string[];
  avg_price: number;
  latitude: number;
  longitude: number;
  opening_hours: any;
  suggested_duration: number;
  popularity_score: number;
}

export default function PlaceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    loadPlaceDetails();
  }, [id]);

  const loadPlaceDetails = async () => {
    try {
      const { data: placeData, error } = await supabase
        .from('places')
        .select('*, districts(name)')
        .eq('id', id)
        .single();

      if (error) throw error;

      setPlace({
        ...placeData,
        district_name: (placeData as any).districts?.name,
      });
    } catch (error) {
      console.error('Error loading place:', error);
    } finally {
      setLoading(false);
    }
  };

  const openMaps = () => {
    if (!place) return;
    
    const url = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
    Linking.openURL(url);
  };

  const formatOpeningHours = (hours: any) => {
    if (!hours) return 'Not available';
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    
    if (hours.closed && hours.closed.includes(today)) {
      return 'Closed today';
    }
    
    return hours[today] || 'Not available';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Place not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const placeImage = place.image_path 
    ? { uri: getImageUrl(place.image_path) || undefined }
    : getDistrictImage(place.district_name || '') || require('../../assets/images/icon.png');

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <View style={styles.imageHeader}>
        <Image
          source={placeImage}
          style={styles.headerImage}
          resizeMode="cover"
        />
        
        {/* Header Buttons */}
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              // TODO: Add to favorites
              console.log('Add to favorites');
            }} 
            style={styles.headerButton}
          >
            <Ionicons name="heart-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        />
      </View>

      <ScrollView style={styles.content}>
        {/* Place Info */}
        <View style={styles.infoSection}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.placeName}>{place.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#6b7280" />
                <Text style={styles.districtName}>{place.district_name}</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={20} color="#fbbf24" />
              <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
            </View>
          </View>

          {/* Quick Info Cards */}
          <View style={styles.quickInfoGrid}>
            <View style={styles.quickInfoCard}>
              <Ionicons name="time-outline" size={24} color="#10b981" />
              <Text style={styles.quickInfoLabel}>Duration</Text>
              <Text style={styles.quickInfoValue}>
                {formatDuration(place.suggested_duration)}
              </Text>
            </View>

            <View style={styles.quickInfoCard}>
              <Ionicons name="cash-outline" size={24} color="#10b981" />
              <Text style={styles.quickInfoLabel}>Avg. Cost</Text>
              <Text style={styles.quickInfoValue}>RM {place.avg_price}</Text>
            </View>

            <View style={styles.quickInfoCard}>
              <Ionicons name="apps-outline" size={24} color="#10b981" />
              <Text style={styles.quickInfoLabel}>Category</Text>
              <Text style={styles.quickInfoValue}>{place.category}</Text>
            </View>
          </View>

          {/* Tags */}
          {place.tags && place.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {place.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>
            {place.description || 'No description available for this place.'}
          </Text>
        </View>

        {/* Opening Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opening Hours</Text>
          <View style={styles.hoursCard}>
            <Ionicons name="time" size={20} color="#10b981" />
            <Text style={styles.hoursText}>
              {formatOpeningHours(place.opening_hours)}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity onPress={openMaps} style={styles.directionsButton}>
              <Ionicons name="navigate" size={16} color="#10b981" />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
          
          {/* Map Preview Placeholder */}
          <TouchableOpacity 
            style={styles.mapPreview}
            onPress={openMaps}
            activeOpacity={0.9}
          >
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map" size={48} color="#9ca3af" />
              <Text style={styles.mapPlaceholderText}>Tap to open in Maps</Text>
              <Text style={styles.coordinates}>
                {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.addToTripButton}
            onPress={() => {
              // TODO: Add to existing trip or create new trip
              console.log('Add to trip');
            }}
          >
            <LinearGradient
              colors={['#10b981', '#84cc16']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addToTripGradient}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.addToTripText}>Add to Trip</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => {
              // TODO: Share place
              console.log('Share place');
            }}
          >
            <Ionicons name="share-social-outline" size={24} color="#10b981" />
          </TouchableOpacity>
        </View>

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
    padding: 32,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header Image
  imageHeader: {
    height: 300,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },

  // Content
  content: {
    flex: 1,
  },

  // Info Section
  infoSection: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  placeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  districtName: {
    fontSize: 16,
    color: '#6b7280',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },

  // Quick Info
  quickInfoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
    textTransform: 'capitalize',
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '500',
  },

  // Sections
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
  },

  // Opening Hours
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  hoursText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },

  // Location
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directionsText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  mapPreview: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  coordinates: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: 'white',
    marginTop: 8,
  },
  addToTripButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addToTripGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addToTripText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
});