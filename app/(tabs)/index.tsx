import { Ionicons } from '@expo/vector-icons';
import { differenceInDays, format, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getDistrictImage } from '../../constants/DistrictImages';
import { getImageUrl } from '../../constants/Storage';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface Trip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  district_name?: string;
  district_image?: any;
  days_until?: number;
}

interface PopularPlace {
  id: string;
  name: string;
  district_id: string;
  district_name?: string;
  image_path?: string;
  category: string;
  rating: number;
  district_image?: any;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextTrip, setNextTrip] = useState<Trip | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<PopularPlace[]>([]);

  useEffect(() => {
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      if (!user) return;

      // Load trips and popular places in parallel
      await Promise.all([
        loadUpcomingTrips(),
        loadPopularPlaces(),
      ]);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUpcomingTrips = async () => {
    try {
      const { data: tripsData, error } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      // Get district details
      const districtIds = [...new Set((tripsData || []).flatMap(t => t.districts || []))];
      
      let districtsMap: { [key: string]: any } = {};
      if (districtIds.length > 0) {
        const { data: districtsData } = await supabase
          .from('districts')
          .select('id, name')
          .in('id', districtIds);

        districtsMap = Object.fromEntries(
          (districtsData || []).map(d => [d.id, d])
        );
      }

      // Process trips
      const processedTrips: Trip[] = (tripsData || []).map((trip: any) => {
        const districtId = trip.districts?.[0];
        const district = districtsMap[districtId];
        const daysUntil = differenceInDays(parseISO(trip.start_date), new Date());
        
        return {
          ...trip,
          district_name: district?.name || 'Unknown',
          district_image: getDistrictImage(district?.name || ''),
          days_until: daysUntil,
        };
      });

      setNextTrip(processedTrips[0] || null);
      setUpcomingTrips(processedTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  };

  const loadPopularPlaces = async () => {
    try {
      // Get one most popular place per district
      const { data: districts } = await supabase
        .from('districts')
        .select('id, name')
        .order('name');

      if (!districts) return;

      const placesPromises = districts.map(async (district) => {
        const { data } = await supabase
          .from('places')
          .select('*')
          .eq('district_id', district.id)
          .eq('is_active', true)
          .eq('category', 'attraction')
          .order('popularity_score', { ascending: false })
          .order('rating', { ascending: false })
          .limit(1)
          .single();

        return data ? {
          ...data,
          district_name: district.name,
          district_image: getDistrictImage(district.name),
        } : null;
      });

      const places = (await Promise.all(placesPromises)).filter(Boolean) as PopularPlace[];
      setPopularPlaces(places);
    } catch (error) {
      console.error('Error loading popular places:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleTripPress = (tripId: string) => {
    router.push(`/trip-detail/${tripId}`);
  };

  const handlePlacePress = (placeId: string) => {
    // TODO: Navigate to place detail page
    router.push(`/place-detail/${placeId}` as any);
  };

  const handleCreateTrip = () => {
    router.push('/trip/select-district');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with Greeting and Profile */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{flexDirection:'row'}}>
            <Text style={styles.greeting}>Welcome <Text style={styles.userName}>{profile?.full_name || 'Traveler'}</Text></Text>
            
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#9ca3af" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Next Trip (Big Card) */}
      {nextTrip && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.nextTripCard}
            onPress={() => handleTripPress(nextTrip.id)}
            activeOpacity={0.9}
          >
            <Image
              source={nextTrip.district_image || require('../../assets/images/icon.png')}
              style={styles.nextTripImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.nextTripOverlay}
            >
              <View style={styles.nextTripBadge}>
                <Ionicons name="rocket" size={16} color="white" />
                <Text style={styles.nextTripBadgeText}>Your Next Trip</Text>
              </View>
              <Text style={styles.nextTripTitle}>{nextTrip.district_name}</Text>
              <Text style={styles.nextTripDate}>
                {nextTrip.days_until === 0 
                  ? 'Today!' 
                  : nextTrip.days_until === 1 
                  ? 'Tomorrow' 
                  : `In ${nextTrip.days_until} days`}
              </Text>
              <View style={styles.nextTripDetails}>
                <Ionicons name="calendar-outline" size={16} color="white" />
                <Text style={styles.nextTripDetailsText}>
                  {format(parseISO(nextTrip.start_date), 'MMM dd')} - {format(parseISO(nextTrip.end_date), 'MMM dd, yyyy')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewDetailsButtonSmall}
                onPress={() => handleTripPress(nextTrip.id)}
              >
                <Text style={styles.viewDetailsButtonText}>View Details</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Upcoming Trips Carousel */}
      {upcomingTrips.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Trips</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/my-trips')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {upcomingTrips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripCard}
                onPress={() => handleTripPress(trip.id)}
                activeOpacity={0.9}
              >
                <Image
                  source={trip.district_image || require('../../assets/images/icon.png')}
                  style={styles.tripCardImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.tripCardOverlay}
                >
                  <Text style={styles.tripCardTitle} numberOfLines={1}>
                    {trip.district_name}
                  </Text>
                  <Text style={styles.tripCardDate}>
                    {format(parseISO(trip.start_date), 'MMM dd, yyyy')}
                  </Text>
                </LinearGradient>
                {trip.days_until !== undefined && trip.days_until <= 7 && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentBadgeText}>
                      {trip.days_until}d
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Popular Places (One per District) */}
      {popularPlaces.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Most Attractive Places</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/discover')}>
              <Text style={styles.seeAllText}>Explore</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.placesGrid}>
            {popularPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.placeCard}
                onPress={() => handlePlacePress(place.id)}
                activeOpacity={0.9}
              >
                <Image
                  source={
                    place.image_path
                      ? { uri: getImageUrl(place.image_path) }
                      : place.district_image || require('../../assets/images/icon.png')
                  }
                  style={styles.placeCardImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.placeCardOverlay}
                >
                  <Text style={styles.placeCardName} numberOfLines={2}>
                    {place.name}
                  </Text>
                  <Text style={styles.placeCardDistrict} numberOfLines={1}>
                    {place.district_name}
                  </Text>
                  <View style={styles.placeCardRating}>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={styles.placeCardRatingText}>{place.rating}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* No Trips - Create Trip CTA */}
      {upcomingTrips.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Trips Planned Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start planning your Kedah adventure today!
          </Text>
          <TouchableOpacity style={styles.createTripButton} onPress={handleCreateTrip}>
            <LinearGradient
              colors={['#10b981', '#84cc16']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createTripGradient}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text style={styles.createTripText}>Create New Trip</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
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
  
  // Header
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 20,
    color: '#25272acd',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },

  // Next Trip Card (Big)
  nextTripCard: {
    marginHorizontal: 24,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  nextTripImage: {
    width: '100%',
    height: '100%',
  },
  nextTripOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  nextTripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 4,
  },
  nextTripBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  nextTripTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  nextTripDate: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 8,
  },
  nextTripDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  nextTripDetailsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  viewDetailsButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewDetailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Horizontal Scroll
  horizontalScroll: {
    paddingLeft: 24,
    paddingRight: 12,
  },

  // Trip Cards (Small)
  tripCard: {
    width: 200,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tripCardImage: {
    width: '100%',
    height: '100%',
  },
  tripCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  tripCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  tripCardDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  urgentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Places Grid
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    gap: 12,
  },
  placeCard: {
    width: '47%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeCardImage: {
    width: '100%',
    height: '100%',
  },
  placeCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  placeCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  placeCardDistrict: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
  },
  placeCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeCardRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  createTripButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  createTripGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  createTripText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
