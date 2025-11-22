import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { generateTrip } from '../../lib/tripGenerator';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';

export default function GenerateScreen() {
  const router = useRouter();
  const { tripData, resetTrip } = useTripStore();
  const { user } = useAuthStore();
  const [status, setStatus] = useState('Preparing your trip...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    generateTripItinerary();
  }, []);

  const generateTripItinerary = async () => {
    try {
      // Step 1: Validating data
      setStatus('Validating trip data...');
      setProgress(10);
      await delay(500);

      if (!tripData.district || !tripData.startDate || !tripData.endDate) {
        throw new Error('Missing trip data');
      }

      // Step 2: Filtering places
      setStatus('Finding best places for you...');
      setProgress(30);

      const itinerary = await generateTrip(
        tripData.district.id,
        tripData.interests || [],
        tripData.budget || 1000,
        tripData.travelerCount || 1,
        tripData.startDate,
        tripData.dayCount || 1
      );

      // Step 3: Optimizing route
      setStatus('Optimizing your route...');
      setProgress(60);
      await delay(1000);

      // Step 4: Calculating costs
      setStatus('Calculating total costs...');
      setProgress(80);
      await delay(800);

      setStatus('Trip generated successfully! ✨');
      setProgress(100);
      await delay(1000);

      // ===================================
      // NEW: Navigate to Review Plan page
      // Store itinerary in tripData for review
      // ===================================
      (tripData as any).generatedItinerary = itinerary;
      
      router.replace('/trip/review-plan');

    } catch (error: any) {
      console.error('Error generating trip:', error);
      setStatus('Failed to generate trip');
      setProgress(0);
      await delay(2000);
      router.back();
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <LinearGradient
      colors={['#10b981', '#34d399', '#6ee7b7']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="rocket" size={80} color="white" />
        </View>

        <Text style={styles.title}>Generating Your Trip</Text>
        <Text style={styles.subtitle}>{status}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        <ActivityIndicator size="large" color="white" style={styles.loader} />

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.featureText}>Smart route optimization</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.featureText}>Optimized daily schedule</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.featureText}>Budget-friendly options</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.featureText}>Time-optimized visits</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: 'white',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
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
    padding: 24,
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
  iconContainer: {
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  loader: {
    marginVertical: 24,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: 'white',
  },
});