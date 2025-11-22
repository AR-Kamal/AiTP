export interface District {
  id: string;
  name: string;
  name_ms: string;
  description?: string;
  image_url?: string;
}

export type TravelerType = 'Solo' | 'Couple' | 'Family' | 'Friends';

export type InterestCategory = 
  | 'Historical' 
  | 'Art & Culture' 
  | 'Entertainment' 
  | 'Nature' 
  | 'Food' 
  | 'Shopping';

export interface TripData {
  district?: District;
  travelerCount?: number;
  travelerType?: TravelerType;
  startDate?: Date;
  endDate?: Date;
  dayCount?: number;
  budget?: number;
  interests?: InterestCategory[];
}