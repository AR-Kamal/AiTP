// app/trip/review-plan.tsx
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { generateTrip } from '../../lib/tripGenerator';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Place {
  id: string;
  name: string;
  category: string;
  rating: number;
  image_path?: string;
}

interface TimeSlot {
  place: Place;
  startTime: Date;
  endTime: Date;
  type: 'attraction' | 'dining' | 'travel';
}

interface DayPlan {
  day: number;
  date: Date;
  slots: TimeSlot[];
}

export default function ReviewPlanScreen() {
  const router = useRouter();
  const { tripData } = useTripStore();
  const { user } = useAuthStore();
  
  // Get initial itinerary from tripData (passed from generate screen)
  const [itinerary, setItinerary] = useState<DayPlan[]>(
    (tripData as any).generatedItinerary?.days || []
  );
  const [removedPlaceIds, setRemovedPlaceIds] = useState<string[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const districtImage = getDistrictImage(tripData.district?.name || '');

  const handleRemovePlace = (placeId: string) => {
    Alert.alert(
      'Remove Place',
      'Remove this place from your itinerary?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setRemovedPlaceIds([...removedPlaceIds, placeId]);
            
            // Remove from current itinerary display
            const updatedItinerary = itinerary.map(day => ({
              ...day,
              slots: day.slots.filter(slot => slot.place.id !== placeId)
            }));
            setItinerary(updatedItinerary);
          }
        }
      ]
    );
  };

  const handleUndo = (placeId: string) => {
    setRemovedPlaceIds(removedPlaceIds.filter(id => id !== placeId));
    // Note: To fully restore, we'd need to re-generate
    // For now, just remove from removed list
  };

  const handleRegenerate = async () => {
    if (removedPlaceIds.length === 0) {
      Alert.alert('No Changes', 'You haven\'t removed any places yet.');
      return;
    }

    Alert.alert(
      'Regenerate Plan',
      `This will find ${removedPlaceIds.length} alternative place${removedPlaceIds.length > 1 ? 's' : ''} for you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: async () => {
            setRegenerating(true);
            
            try {
              // Call algorithm with excluded places
              const newItinerary = await generateTrip(
                tripData.district?.id || '',
                tripData.interests || [],
                tripData.budget || 1000,
                tripData.travelerCount || 1,
                tripData.startDate!,
                tripData.dayCount || 1,
                removedPlaceIds // Excluded places
              );

              setItinerary(newItinerary.days);
              setRemovedPlaceIds([]); // Reset removed list
              
              Alert.alert(
                'Success!',
                'Your itinerary has been updated with new places.'
              );
            } catch (error) {
              console.error('Regeneration error:', error);
              Alert.alert(
                'Error',
                'Failed to regenerate plan. Please try again.'
              );
            } finally {
              setRegenerating(false);
            }
          }
        }
      ]
    );
  };

  const handleConfirm = async () => {
    if (itinerary.length === 0) {
      Alert.alert('Empty Plan', 'Your itinerary is empty. Please regenerate.');
      return;
    }

    setConfirming(true);

    try {
      // Save to database
      const { data, error } = await supabase
        .from('travel_plans')
        .insert({
          user_id: user?.id,
          title: `${tripData.travelerType} Trip to ${tripData.district?.name}`,
          start_date: tripData.startDate?.toISOString().split('T')[0],
          end_date: tripData.endDate?.toISOString().split('T')[0],
          districts: [tripData.district?.id],
          status: 'active',
          attractions: { days: itinerary },
          ai_suggestions: {
            travelerCount: tripData.travelerCount,
            travelerType: tripData.travelerType,
            budget: tripData.budget,
            interests: tripData.interests,
            removedPlaces: removedPlaceIds,
          },
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Trip Saved!',
        'Your itinerary has been saved to My Trips.',
        [
          {
            text: 'View Trip',
            onPress: () => router.replace('/(tabs)/my-trips')
          }
        ]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save trip. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Plan',
      'Are you sure you want to discard this itinerary?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)')
        }
      ]
    );
  };

  if (regenerating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Finding better alternatives...</Text>
        <Text style={styles.loadingSubtext}>
          Regenerating your itinerary with new places
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Your Plan</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '95%' }]} />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Trip Summary */}
        <View style={styles.summaryCard}>
          <Image
            source={districtImage || require('../../assets/images/icon.png')}
            style={styles.summaryImage}
            resizeMode="cover"
          />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle}>
              Trip to {tripData.district?.name}
            </Text>
            <Text style={styles.summaryDetails}>
              {format(tripData.startDate!, 'MMM dd')} - {format(tripData.endDate!, 'MMM dd, yyyy')}
              {' • '}{tripData.dayCount} days
            </Text>
            <Text style={styles.summaryBudget}>
              Budget: RM {tripData.budget?.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#10b981" />
          <Text style={styles.infoText}>
            Review your itinerary. Remove places you don't like and regenerate to find alternatives.
          </Text>
        </View>

        {/* Daily Itinerary */}
        {itinerary.map((day) => (
          <View key={day.day} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>Day {day.day}</Text>
              <Text style={styles.dayDate}>
                {format(day.date, 'EEEE, MMM dd')}
              </Text>
            </View>

            {day.slots
              .filter(slot => slot.type !== 'travel')
              .map((slot, index) => {
                const isRemoved = removedPlaceIds.includes(slot.place.id);
                
                return (
                  <View
                    key={`${slot.place.id}-${index}`}
                    style={[
                      styles.placeCard,
                      isRemoved && styles.placeCardRemoved
                    ]}
                  >
                    {/* Time Badge */}
                    <View style={styles.timeBadge}>
                      <Ionicons name="time-outline" size={14} color="#6b7280" />
                      <Text style={styles.timeText}>
                        {format(slot.startTime, 'HH:mm')} - {format(slot.endTime, 'HH:mm')}
                      </Text>
                    </View>

                    <View style={styles.placeCardContent}>
                      {/* Place Image */}
                        <Image 
                        source={
                            slot.place.image_path
                            ? { uri: getImageUrl(slot.place.image_path) }
                            : (districtImage || require('../../assets/images/icon.png')) // <--- FIXED: Added fallback
                        }
                        style={styles.placeImage}
                        resizeMode="cover"
                        />
                      {/* <Image source={ //<--the error is here
                          slot.place.image_path
                            ? { uri: getImageUrl(slot.place.image_path) }
                            : districtImage
                        }
                        style={styles.placeImage}
                        resizeMode="cover"
                      /> */}

                      {/* Place Info */}
                      <View style={styles.placeInfo}>
                        <Text style={styles.placeName} numberOfLines={2}>
                          {slot.place.name}
                        </Text>
                        
                        <View style={styles.placeDetails}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>
                              {slot.place.category}
                            </Text>
                          </View>
                          
                          <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#f59e0b" />
                            <Text style={styles.ratingText}>
                              {slot.place.rating}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Remove/Undo Button */}
                      <TouchableOpacity
                        style={[
                          styles.removeButton,
                          isRemoved && styles.undoButton
                        ]}
                        onPress={() => 
                          isRemoved 
                            ? handleUndo(slot.place.id)
                            : handleRemovePlace(slot.place.id)
                        }
                      >
                        <Ionicons
                          name={isRemoved ? "arrow-undo" : "close-circle"}
                          size={24}
                          color={isRemoved ? "#10b981" : "#ef4444"}
                        />
                      </TouchableOpacity>
                    </View>

                    {isRemoved && (
                      <View style={styles.removedOverlay}>
                        <Text style={styles.removedText}>Removed</Text>
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        ))}

        {/* Removal Summary */}
        {removedPlaceIds.length > 0 && (
          <View style={styles.removalSummary}>
            <Ionicons name="information-circle-outline" size={20} color="#f59e0b" />
            <Text style={styles.removalText}>
              {removedPlaceIds.length} place{removedPlaceIds.length > 1 ? 's' : ''} removed
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        {removedPlaceIds.length > 0 && (
          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={handleRegenerate}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.regenerateButtonText}>
              Regenerate Plan
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={confirming}
        >
          <LinearGradient
            colors={['#10b981', '#84cc16']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmButtonGradient}
          >
            {confirming ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.confirmButtonText}>Confirm Plan</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: 'white',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  
  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryImage: {
    width: 100,
    height: 100,
  },
  summaryInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryBudget: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf4',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    lineHeight: 20,
  },

  // Day Section
  daySection: {
    marginTop: 24,
  },
  dayHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  dayDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },

  // Place Card
  placeCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  placeCardRemoved: {
    opacity: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  placeCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  placeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeInfo: {
    flex: 1,
    paddingLeft: 12,
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
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '500',
    textTransform: 'capitalize',
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
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  undoButton: {
    // Style for undo button
  },
  removedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },

  // Removal Summary
  removalSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  removalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
  },

  // Footer
  footer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});