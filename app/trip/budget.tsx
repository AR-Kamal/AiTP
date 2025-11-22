import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTripStore } from '../../store/tripStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const BUDGET_PRESETS = [
  { label: 'Cheap', min: 100, max: 500, icon: 'cash-outline' },
  { label: 'Moderate', min: 500, max: 1500, icon: 'wallet-outline' },
  { label: 'Luxury', min: 1500, max: 5000, icon: 'diamond-outline' },
];

export default function BudgetScreen() {
  const router = useRouter();
  const { setBudget, tripData } = useTripStore();
  const [budget, setBudgetValue] = useState(tripData.budget?.toString() || '');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleBudgetChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setBudgetValue(numericValue);
    setSelectedPreset(null);
  };

  const handlePresetSelect = (preset: typeof BUDGET_PRESETS[0]) => {
    setSelectedPreset(preset.label);
    setBudgetValue(preset.min.toString());
  };

  const handleNext = () => {
    const budgetNum = parseFloat(budget);

    if (!budgetNum || budgetNum <= 0) {
      Alert.alert('Invalid Budget', 'Please enter your budget amount');
      return;
    }

    setBudget(budgetNum);
    router.push('/trip/interests');
  };

  const handleCancel = () => {
    router.replace('/(tabs)');
  };

  const isNextEnabled = budget && parseFloat(budget) > 0;

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
          <View style={[styles.progressFill, { width: '56%' }]} />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Your Budget</Text>
        <Text style={styles.subtitle}>
          Enter your budget in RM (Malaysian Ringgit)
        </Text>

        <View style={styles.budgetInputContainer}>
          <Text style={styles.currencySymbol}>RM</Text>
          <TextInput
            style={styles.budgetInput}
            value={budget}
            onChangeText={handleBudgetChange}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#d1d5db"
          />
        </View>

        <Text style={styles.presetsLabel}>Quick Budget Selection</Text>
        <View style={styles.presetsContainer}>
          {BUDGET_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.label}
              style={[
                styles.presetCard,
                selectedPreset === preset.label && styles.presetCardSelected,
              ]}
              onPress={() => handlePresetSelect(preset)}
            >
              <Ionicons
                name={preset.icon as any}
                size={32}
                color={selectedPreset === preset.label ? '#10b981' : '#6b7280'}
              />
              <Text
                style={[
                  styles.presetLabel,
                  selectedPreset === preset.label && styles.presetLabelSelected,
                ]}
              >
                {preset.label}
              </Text>
              <Text style={styles.presetRange}>
                RM {preset.min} - {preset.max}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>
            This budget will help us recommend suitable attractions and activities for your trip
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, !isNextEnabled && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isNextEnabled}
        >
          <LinearGradient
            colors={isNextEnabled ? ['#10b981', '#84cc16'] : ['#d1d5db', '#d1d5db']}
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
    paddingTop: 90,
    paddingHorizontal: 24,
    //paddingBottom: 16,
    backgroundColor: 'white',
  },
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
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  daysText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
    marginRight: 12,
  },
  budgetInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    padding: 0,
  },
  presetsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  presetsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  presetCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  presetLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginLeft: 16,
  },
  presetLabelSelected: {
    color: '#10b981',
  },
  presetRange: {
    fontSize: 14,
    color: '#6b7280',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  interestIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCount: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
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