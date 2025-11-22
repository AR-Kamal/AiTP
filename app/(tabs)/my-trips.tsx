// app/(tabs)/my-trips.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { getDistrictImage } from '../../constants/DistrictImages';
import { format, parseISO, isPast, isFuture } from 'date-fns';

interface Trip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'saved';
  districts: string[];
  district_name?: string;
  district_image?: any;
  created_at: string;
}

export default function MyTripsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [pastTrips, setPastTrips] = useState<Trip[]>([]);
  const [savedTrips, setSavedTrips] = useState<Trip[]>([]);
  const [nextTrip, setNextTrip] = useState<Trip | null>(null);

  useEffect(() => {
    loadTrips();
  }, [user]);

  const loadTrips = async () => {
    try {
      if (!user) return;

      // Step 1: Get all trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('travel_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (tripsError) throw tripsError;

      // Step 2: Get all unique district IDs
      const districtIds = [
        ...new Set(
          (tripsData || [])
            .flatMap(trip => trip.districts || [])
            .filter(Boolean)
        )
      ];

      // Step 3: Get district details
      let districtsMap: { [key: string]: any } = {};
      if (districtIds.length > 0) {
        const { data: districtsData, error: districtsError } = await supabase
          .from('districts')
          .select('id, name, name_ms')
          .in('id', districtIds);

        if (!districtsError && districtsData) {
          districtsMap = Object.fromEntries(
            districtsData.map(d => [d.id, d])
          );
        }
      }

      // Step 4: Process trips with district info
      const processedTrips: Trip[] = (tripsData || []).map((trip: any) => {
        const districtId = trip.districts?.[0]; // Get first district
        const district = districtsMap[districtId];
        
        return {
          ...trip,
          district_name: district?.name || 'Unknown',
          district_image: getDistrictImage(district?.name || ''),
        };
      });

      setTrips(processedTrips);
      categorizeTrips(processedTrips);

    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const categorizeTrips = (allTrips: Trip[]) => {
    const now = new Date();
    
    // Filter by status and date
    const upcoming = allTrips.filter(trip => {
      const startDate = parseISO(trip.start_date);
      return trip.status === 'active' && isFuture(startDate);
    }).slice(0, 10);

    const past = allTrips.filter(trip => {
      const endDate = parseISO(trip.end_date);
      return trip.status === 'completed' || isPast(endDate);
    }).slice(0, 10);

    const saved = allTrips.filter(trip => 
      trip.status === 'saved'
    ).slice(0, 10);

    setUpcomingTrips(upcoming);
    setPastTrips(past);
    setSavedTrips(saved);
    
    // Set next upcoming trip
    setNextTrip(upcoming[0] || null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  const handleTripPress = (tripId: string) => {
    // TODO: Navigate to trip detail page
    router.push(`/trip-detail/${tripId}` as any);
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
        <TouchableOpacity onPress={handleCreateTrip}>
          <Ionicons name="add-circle" size={32} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Section 1: Next Trip (Big Card) */}
      {nextTrip ? (
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
                <Ionicons name="calendar" size={16} color="white" />
                <Text style={styles.nextTripBadgeText}>Next Trip</Text>
              </View>
              <Text style={styles.nextTripTitle}>{nextTrip.title}</Text>
              <Text style={styles.nextTripDate}>
                {format(parseISO(nextTrip.start_date), 'MMM dd')} - {format(parseISO(nextTrip.end_date), 'MMM dd, yyyy')}
              </Text>
              <Text style={styles.nextTripLocation}>
                <Ionicons name="location" size={16} color="white" />
                {' '}{nextTrip.district_name}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => handleTripPress(nextTrip.id)}
          >
            <LinearGradient
              colors={['#10b981', '#84cc16']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.viewDetailsGradient}
            >
              <Text style={styles.viewDetailsText}>View Trip Details</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Section 2: Upcoming Trips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Trips</Text>
        
        {upcomingTrips.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tripsScrollContainer}
          >
            {upcomingTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onPress={() => handleTripPress(trip.id)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>There is no Upcoming Trip</Text>
          </View>
        )}
      </View>

      {/* Section 3: Past Trips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Past Trips</Text>
        
        {pastTrips.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tripsScrollContainer}
          >
            {pastTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onPress={() => handleTripPress(trip.id)}
                isPast
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No past trips yet</Text>
          </View>
        )}
      </View>

      {/* Section 4: Saved Trips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved Trips</Text>
        
        {savedTrips.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tripsScrollContainer}
          >
            {savedTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onPress={() => handleTripPress(trip.id)}
                isSaved
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>There is no Saved Trip</Text>
          </View>
        )}
      </View>

      {/* No trips at all */}
      {trips.length === 0 && (
        <View style={styles.noTripsContainer}>
          <Ionicons name="map-outline" size={80} color="#d1d5db" />
          <Text style={styles.noTripsTitle}>No Trip Planned Yet</Text>
          <Text style={styles.noTripsSubtitle}>
            Start planning your Kedah adventure today!
          </Text>
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateTrip}
          >
            <LinearGradient
              colors={['#10b981', '#84cc16']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text style={styles.createButtonText}>Create New Trip</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ===================================
// Trip Card Component
// ===================================

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  isPast?: boolean;
  isSaved?: boolean;
}

function TripCard({ trip, onPress, isPast, isSaved }: TripCardProps) {
  return (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={onPress}
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
          {trip.title}
        </Text>
        <Text style={styles.tripCardDate}>
          {format(parseISO(trip.start_date), 'MMM dd, yyyy')}
        </Text>
        <Text style={styles.tripCardLocation} numberOfLines={1}>
          <Ionicons name="location" size={12} color="white" />
          {' '}{trip.district_name}
        </Text>
      </LinearGradient>

      {isPast && (
        <View style={[styles.tripBadge, { backgroundColor: '#6b7280' }]}>
          <Text style={styles.tripBadgeText}>Past</Text>
        </View>
      )}

      {isSaved && (
        <View style={[styles.tripBadge, { backgroundColor: '#f59e0b' }]}>
          <Ionicons name="bookmark" size={12} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ===================================
// Styles
// ===================================

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  
  // Next Trip Card (Big)
  nextTripCard: {
    marginHorizontal: 24,
    height: 300,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  nextTripDate: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  nextTripLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  viewDetailsButton: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewDetailsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Small Trip Cards
  tripsScrollContainer: {
    paddingLeft: 24,
    paddingRight: 12,
  },
  tripCard: {
    width: 200,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: 'white',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  tripCardDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  tripCardLocation: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tripBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tripBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },

  // No Trips Container
  noTripsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  noTripsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 8,
  },
  noTripsSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});