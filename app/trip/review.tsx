// ===================================
// Step 6: app/trip/review.tsx
// ===================================
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; // Recommended if available, otherwise remove
import { useTripStore } from '../../store/tripStore';

export default function ReviewScreen() {
  const router = useRouter();
  const { tripData } = useTripStore();
  const insets = useSafeAreaInsets(); 

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return format(date, 'MMM dd, yyyy');
  };

  const handleEdit = (step: string) => {
    router.push(`/trip/${step}` as any);
  };

  const handleGenerate = () => {
    router.push('/trip/generate');
  };

  const handleCancel = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1f2937" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons name="close" size={28} color="#1f2937" />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '85%' }]} />
        </View>
      </View>

      {/* --- FIX APPLIED HERE --- */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Review Your Choices</Text>
        <Text style={styles.subtitle}>
          Check your trip details before generating
        </Text>

        {/* District */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewIconContainer}>
              <Ionicons name="location" size={24} color="#10b981" />
            </View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewLabel}>Destination</Text>
              <Text style={styles.reviewValue}>{tripData.district?.name || 'Not selected'}</Text>
            </View>
            <TouchableOpacity onPress={() => handleEdit('select-district')}>
              <Ionicons name="pencil" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Travelers */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewIconContainer}>
              <Ionicons name="people" size={24} color="#10b981" />
            </View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewLabel}>Travelers</Text>
              <Text style={styles.reviewValue}>
                {tripData.travelerCount} {tripData.travelerCount === 1 ? 'Person' : 'People'} • {tripData.travelerType}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleEdit('select-traveler')}>
              <Ionicons name="pencil" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewIconContainer}>
              <Ionicons name="calendar" size={24} color="#10b981" />
            </View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewLabel}>Travel Dates</Text>
              <Text style={styles.reviewValue}>
                {formatDate(tripData.startDate)} - {formatDate(tripData.endDate)}
              </Text>
              <Text style={styles.reviewSubValue}>
                {tripData.dayCount} {tripData.dayCount === 1 ? 'day' : 'days'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleEdit('select-date')}>
              <Ionicons name="pencil" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewIconContainer}>
              <Ionicons name="wallet" size={24} color="#10b981" />
            </View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewLabel}>Budget</Text>
              <Text style={styles.reviewValue}>RM {tripData.budget?.toLocaleString()}</Text>
            </View>
            <TouchableOpacity onPress={() => handleEdit('budget')}>
              <Ionicons name="pencil" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewIconContainer}>
              <Ionicons name="heart" size={24} color="#10b981" />
            </View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewLabel}>Interests</Text>
              <View style={styles.interestsContainer}>
                {tripData.interests?.map((interest) => (
                  <View key={interest} style={styles.interestTag}>
                    <Text style={styles.interestTagText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity onPress={() => handleEdit('interests')}>
              <Ionicons name="pencil" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="sparkles" size={20} color="#10b981" />
          <Text style={styles.infoText}>
            Our AI will create a personalized itinerary based on your preferences
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <LinearGradient
            colors={['#10b981', '#84cc16']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateButtonGradient}
          >
            <Ionicons name="sparkles" size={20} color="white" />
            <Text style={styles.generateButtonText}>Generate AI Itinerary</Text>
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
  header: {
    // Ensure you have proper padding for status bar here if not using SafeAreaView
    paddingTop: 20, 
    paddingHorizontal: 24,
    //paddingBottom: 16,
    backgroundColor: 'white',
  },
  // --- FIXED: Removed the bad 'content' style block ---
  scrollView: {
    flex: 1, 
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    // Removed justifyContent/alignItems so cards stretch properly
  },
  // ---------------------------------------------------
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 4,
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    //marginTop: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  reviewSubValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  interestTag: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  interestTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 20, // Added a bit more padding for better look on devices with home indicator
    paddingTop: 16,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});