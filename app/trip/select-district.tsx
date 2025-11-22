import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DISTRICT_IMAGES } from '../../constants/DistrictImages';
import { supabase } from '../../lib/supabase';
import { useTripStore } from '../../store/tripStore';
import { District } from '../../types/trip';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 190;


export default function SelectDistrictScreen() {
  const router = useRouter();
  const { setDistrict, tripData } = useTripStore();
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    tripData.district || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      console.log('Fetching districts...');
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Districts fetched:', data);
      setDistricts(data || []);
      
      // If no data from Supabase, use fallback data
      if (!data || data.length === 0) {
        console.log('No districts in database, using fallback data');
        setDistricts(FALLBACK_DISTRICTS);
      }
    } catch (err: any) {
      console.error('Error fetching districts:', err);
      setError(err.message);
      // Use fallback data on error
      setDistricts(FALLBACK_DISTRICTS);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (district: District) => {
    setSelectedDistrict(district);
  };

  const handleNext = () => {
    if (selectedDistrict) {
      setDistrict(selectedDistrict);
      router.push('/trip/select-traveler');
    }
  };

  const handleCancel = () => {
    router.replace('/(tabs)');
  };

  const getDistrictImage = (districtName: string) => {
    return DISTRICT_IMAGES[districtName];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '14%' }]} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Select District</Text>
        <Text style={styles.subtitle}>Where are you going?</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading districts...</Text>
          </View>
        ) : error && districts.length === 0 ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>Error loading districts</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.cardsContainer}
          >
            {districts.map((district) => {
              const localImage = getDistrictImage(district.name);
              
              return (
                <TouchableOpacity
                  key={district.id}
                  style={[
                    styles.card,
                    selectedDistrict?.id === district.id && styles.cardSelected,
                  ]}
                  onPress={() => handleSelect(district)}
                  activeOpacity={0.9}
                >
                  {localImage ? (
                    <Image
                      source={localImage}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  ) : district.image_url ? (
                    <Image
                      source={{ uri: district.image_url }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                      <Ionicons name="image-outline" size={48} color="#9ca3af" />
                    </View>
                  )}
                  
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.cardOverlay}
                  >
                    <Text style={styles.cardTitle}>{district.name}</Text>
                    {district.name_ms && district.name_ms !== district.name && (
                      <Text style={styles.cardSubtitle}>{district.name_ms}</Text>
                    )}
                  </LinearGradient>

                  {selectedDistrict?.id === district.id && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedDistrict && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedDistrict}
        >
          <LinearGradient
            colors={
              selectedDistrict
                ? ['#10b981', '#84cc16']
                : ['#d1d5db', '#d1d5db']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Fallback districts if Supabase is empty or fails
const FALLBACK_DISTRICTS: District[] = [
  { 
    id: '1', 
    name: 'Kota Setar', 
    name_ms: 'Kota Setar',
    description: 'Capital city of Kedah'
  },
  { 
    id: '2', 
    name: 'Kubang Pasu', 
    name_ms: 'Kubang Pasu',
    description: 'Northern district'
  },
  { 
    id: '3', 
    name: 'Padang Terap', 
    name_ms: 'Padang Terap',
    description: 'Border district'
  },
  { 
    id: '4', 
    name: 'Langkawi', 
    name_ms: 'Langkawi',
    description: 'Famous island destination'
  },
  { 
    id: '5', 
    name: 'Kuala Muda', 
    name_ms: 'Kuala Muda',
    description: 'Coastal district'
  },
  { 
    id: '6', 
    name: 'Yan', 
    name_ms: 'Yan',
    description: 'Coastal town'
  },
  { 
    id: '7', 
    name: 'Pendang', 
    name_ms: 'Pendang',
    description: 'Agricultural area'
  },
  { 
    id: '8', 
    name: 'Sik', 
    name_ms: 'Sik',
    description: 'Rice bowl area'
  },
  { 
    id: '9', 
    name: 'Baling', 
    name_ms: 'Baling',
    description: 'Eastern district'
  },
  { 
    id: '10', 
    name: 'Kulim', 
    name_ms: 'Kulim',
    description: 'Industrial hub'
  },
  { 
    id: '11', 
    name: 'Bandar Baharu', 
    name_ms: 'Bandar Baharu',
    description: 'Southern district'
  },
  { 
    id: '12', 
    name: 'Pokok Sena', 
    name_ms: 'Pokok Sena',
    description: 'Rural district'
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    //paddingBottom: 16,
    backgroundColor: 'white',
  },
  backButton: {
    marginBottom: 16,
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
    paddingTop: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    paddingHorizontal: 24,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  scrollView: {
    flexGrow: 0,
    //height: 330,
  },
  cardsContainer: {
    paddingLeft: 24,
    paddingRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: 'white',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 3,            // Always reserve space for the border
    borderColor: 'transparent'
  },
  cardSelected: {
    //borderWidth: 3,
    borderColor: '#10b981',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingBottom: 10,
    paddingTop:15,
    paddingHorizontal:24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
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
  nextButton: {
    flex: 2,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
