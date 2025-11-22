import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { useTripStore } from '../../store/tripStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectDateScreen() {
  const router = useRouter();
  const { setDates, tripData } = useTripStore();
  const [startDate, setStartDate] = useState<string | null>(
    tripData.startDate ? tripData.startDate.toISOString().split('T')[0] : null
  );
  const [endDate, setEndDate] = useState<string | null>(
    tripData.endDate ? tripData.endDate.toISOString().split('T')[0] : null
  );

  const handleDayPress = (day: any) => {
    if (!startDate || (startDate && endDate)) {
      // First selection or reset
      setStartDate(day.dateString);
      setEndDate(null);
    } else {
      // Second selection
      if (day.dateString < startDate) {
        // If earlier than start, make it new start
        setEndDate(startDate);
        setStartDate(day.dateString);
      } else {
        setEndDate(day.dateString);
      }
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end day
  };

  const getMarkedDates = () => {
    if (!startDate) return {};

    const marked: any = {};
    
    if (!endDate) {
      marked[startDate] = {
        selected: true,
        color: '#10b981',
        textColor: 'white',
      };
    } else {
      // Mark range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const current = new Date(start);

      while (current <= end) {
        const dateString = current.toISOString().split('T')[0];
        marked[dateString] = {
          color: dateString === startDate || dateString === endDate ? '#10b981' : '#d1fae5',
          textColor: dateString === startDate || dateString === endDate ? 'white' : '#1f2937',
          startingDay: dateString === startDate,
          endingDay: dateString === endDate,
        };
        current.setDate(current.getDate() + 1);
      }
    }

    return marked;
  };

  const handleNext = () => {
    if (!startDate || !endDate) {
      Alert.alert('Select Dates', 'Please select both start and end dates');
      return;
    }

    setDates(new Date(startDate), new Date(endDate));
    router.push('/trip/budget');
  };

  const handleCancel = () => {
    router.replace('/(tabs)');
  };

  const dayCount = calculateDays();
  const isNextEnabled = startDate !== null && endDate !== null;

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
          <View style={[styles.progressFill, { width: '42%' }]} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Select Date</Text>
        <Text style={styles.subtitle}>
          Choose your start date and end date
        </Text>

        <Calendar
          onDayPress={handleDayPress}
          markedDates={getMarkedDates()}
          markingType="period"
          minDate={new Date().toISOString().split('T')[0]}
          theme={{
            selectedDayBackgroundColor: '#10b981',
            todayTextColor: '#10b981',
            arrowColor: '#10b981',
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
          }}
        />

        {dayCount > 0 && (
          <View style={styles.daysContainer}>
            <Ionicons name="calendar" size={24} color="#10b981" />
            <Text style={styles.daysText}>
              {dayCount} {dayCount === 1 ? 'day' : 'days'} selected
            </Text>
          </View>
        )}
      </View>

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