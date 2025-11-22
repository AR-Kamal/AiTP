// app/trip/select-traveler.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTripStore } from '../../store/tripStore';
import { TravelerType } from '../../types/trip';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectTravelerScreen() {
  const router = useRouter();
  const { setTraveler, tripData } = useTripStore();
  const [travelerCount, setTravelerCount] = useState(
    tripData.travelerCount?.toString() || ''
  );
  const [selectedType, setSelectedType] = useState<TravelerType | null>(
    tripData.travelerType || null
  );

  // Get available traveler types based on count
  const getAvailableTypes = (count: number): TravelerType[] => {
    if (count === 1) return ['Solo'];
    if (count === 2) return ['Couple', 'Family', 'Friends'];
    if (count >= 3) return ['Family', 'Friends'];
    return [];
  };

  // Auto-select Solo when count is 1
  useEffect(() => {
    const count = parseInt(travelerCount);
    if (count === 1) {
      setSelectedType('Solo');
    } else if (count > 1 && selectedType === 'Solo') {
      setSelectedType(null);
    }
  }, [travelerCount]);

  const handleCountChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // Limit to 2 digits (max 99)
    if (numericValue.length <= 2) {
      setTravelerCount(numericValue);
    }
  };

  const handleIncrement = () => {
    const current = parseInt(travelerCount) || 0;
    if (current < 20) {
      setTravelerCount((current + 1).toString());
    }
  };

  const handleDecrement = () => {
    const current = parseInt(travelerCount) || 0;
    if (current > 1) {
      setTravelerCount((current - 1).toString());
    }
  };

  const handleTypeSelect = (type: TravelerType) => {
    setSelectedType(type);
  };

  const handleNext = () => {
    const count = parseInt(travelerCount);
    
    if (!count || count < 1) {
      Alert.alert('Invalid Input', 'Please enter the number of travelers');
      return;
    }

    if (count > 20) {
      Alert.alert('Too Many Travelers', 'Maximum 20 travelers allowed');
      return;
    }

    if (!selectedType) {
      Alert.alert('Select Type', 'Please select traveler type');
      return;
    }

    if (selectedType == 'Couple' && count > 2) {
      Alert.alert('Invalid traveler type');
      return;
    }

    setTraveler(count, selectedType);
    router.push('/trip/select-date');
  };

  const handleCancel = () => {
    router.replace('/(tabs)');
  };

  const count = parseInt(travelerCount) || 0;
  const availableTypes = getAvailableTypes(count);
  const isNextEnabled = count >= 1 && count <= 20 && selectedType !== null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
          <View style={[styles.progressFill, { width: '28%' }]} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Select Traveler</Text>
        <Text style={styles.subtitle}>
          Choose number of traveler and the type
        </Text>

        {/* Number Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Number of Traveler(s)</Text>
          <View style={styles.numberInputContainer}>
            <TouchableOpacity
              style={[styles.counterButton, count <= 1 && styles.counterButtonDisabled]}
              onPress={handleDecrement}
              disabled={count <= 1}
            >
              <Ionicons name="remove" size={24} color={count <= 1 ? '#d1d5db' : '#10b981'} />
            </TouchableOpacity>

            <TextInput
              style={styles.numberInput}
              value={travelerCount}
              onChangeText={handleCountChange}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#9ca3af"
              maxLength={2}
            />

            <TouchableOpacity
              style={[styles.counterButton, count >= 20 && styles.counterButtonDisabled]}
              onPress={handleIncrement}
              disabled={count >= 20}
            >
              <Ionicons name="add" size={24} color={count >= 20 ? '#d1d5db' : '#10b981'} />
            </TouchableOpacity>
          </View>
          {count > 20 && (
            <Text style={styles.errorText}>Maximum 20 travelers</Text>
          )}
        </View>

        {/* Traveler Type Selection */}
        <View style={styles.typeSection}>
          <Text style={styles.label}>Traveler Type</Text>
          
          {count === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>
                Enter number of travelers first
              </Text>
            </View>
          ) : (
            <View style={styles.typeGrid}>
              {['Solo', 'Couple', 'Family', 'Friends'].map((type) => {
                const isAvailable = availableTypes.includes(type as TravelerType);
                const isSelected = selectedType === type;
                const isAutoSelected = count === 1 && type === 'Solo';

                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeCard,
                      !isAvailable && styles.typeCardDisabled,
                      isSelected && styles.typeCardSelected,
                    ]}
                    onPress={() => isAvailable && handleTypeSelect(type as TravelerType)}
                    disabled={!isAvailable}
                  >
                    <View style={styles.typeIconContainer}>
                      {type === 'Solo' && (
                        <Ionicons
                          name="person"
                          size={32}
                          color={isSelected ? '#10b981' : isAvailable ? '#6b7280' : '#d1d5db'}
                        />
                      )}
                      {type === 'Couple' && (
                        <Ionicons
                          name="heart"
                          size={32}
                          color={isSelected ? '#10b981' : isAvailable ? '#6b7280' : '#d1d5db'}
                        />
                      )}
                      {type === 'Family' && (
                        <Ionicons
                          name="home"
                          size={32}
                          color={isSelected ? '#10b981' : isAvailable ? '#6b7280' : '#d1d5db'}
                        />
                      )}
                      {type === 'Friends' && (
                        <Ionicons
                          name="people"
                          size={32}
                          color={isSelected ? '#10b981' : isAvailable ? '#6b7280' : '#d1d5db'}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.typeText,
                        !isAvailable && styles.typeTextDisabled,
                        isSelected && styles.typeTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedCheck}>
                        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                      </View>
                    )}
                    {isAutoSelected && (
                      <View style={styles.autoSelectedBadge}>
                        <Text style={styles.autoSelectedText}>Auto</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {count > 0 && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
              <Text style={styles.infoText}>
                {count === 1 && 'Solo travel is automatically selected for 1 person'}
                {count === 2 && 'Choose your travel companion type'}
                {count >= 3 && 'Available for family or friends group travel'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            !isNextEnabled && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!isNextEnabled}
        >
          <LinearGradient
            colors={
              isNextEnabled
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
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  inputSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: '#f9fafb',
  },
  numberInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    padding: 0,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
  },
  typeSection: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
    textAlign: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  typeCardDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.5,
  },
  typeCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  typeIconContainer: {
    marginBottom: 12,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  typeTextDisabled: {
    color: '#d1d5db',
  },
  typeTextSelected: {
    color: '#10b981',
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  autoSelectedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  autoSelectedText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
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