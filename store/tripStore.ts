import { create } from 'zustand';
import { TripData, District, TravelerType, InterestCategory } from '../types/trip';

interface TripStore {
  tripData: TripData;
  setDistrict: (district: District) => void;
  setTraveler: (count: number, type: TravelerType) => void;
  setDates: (startDate: Date, endDate: Date) => void;
  setBudget: (budget: number) => void;
  setInterests: (interests: InterestCategory[]) => void;
  resetTrip: () => void;
  isStepComplete: (step: number) => boolean;
}

export const useTripStore = create<TripStore>((set, get) => ({
  tripData: {},
  
  setDistrict: (district) => 
    set((state) => ({ tripData: { ...state.tripData, district } })),
  
  setTraveler: (travelerCount, travelerType) =>
    set((state) => ({ 
      tripData: { ...state.tripData, travelerCount, travelerType } 
    })),
  
  setDates: (startDate, endDate) => {
    const dayCount = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    set((state) => ({ 
      tripData: { ...state.tripData, startDate, endDate, dayCount } 
    }));
  },
  
  setBudget: (budget) =>
    set((state) => ({ tripData: { ...state.tripData, budget } })),
  
  setInterests: (interests) =>
    set((state) => ({ tripData: { ...state.tripData, interests } })),
  
  resetTrip: () => set({ tripData: {} }),
  
  isStepComplete: (step) => {
    const { tripData } = get();
    switch (step) {
      case 1: return !!tripData.district;
      case 2: return !!tripData.travelerCount && !!tripData.travelerType;
      case 3: return !!tripData.startDate && !!tripData.endDate;
      case 4: return !!tripData.budget && tripData.budget > 0;
      case 5: return !!tripData.interests && tripData.interests.length > 0;
      default: return false;
    }
  },
}));
