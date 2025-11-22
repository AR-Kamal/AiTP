// lib/tripGenerator.ts
// Deterministic algorithm to generate trip itinerary

import { supabase } from './supabase';

interface Place {
  id: string;
  name: string;
  district_id: string;
  tags: string[];
  avg_price: number;
  latitude: number;
  longitude: number;
  opening_hours: OpeningHours;
  suggested_duration: number;
  category: string;
  popularity_score: number;
  rating: number;
  description?: string;
}

interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  closed: string[];
}

interface TimeSlot {
  place: Place;
  startTime: Date;
  endTime: Date;
  type: 'attraction' | 'dining' | 'travel';
  travelTime?: number;
}

interface DayItinerary {
  day: number;
  date: Date;
  slots: TimeSlot[];
  totalCost: number;
}

interface TripItinerary {
  days: DayItinerary[];
  totalCost: number;
  totalPlaces: number;
}

// Constants
const START_TIME = 9; // 9 AM
const END_TIME = 18; // 6 PM
const LUNCH_TIME = 13; // 1 PM
const LUNCH_DURATION = 60; // minutes
const TRAVEL_BUFFER = 20; // minutes between locations
const AVG_SPEED_KMH = 40; // Average speed in km/h

// ===================================
// Phase 1: Filter and Select Places
// ===================================

// ===================================
// Phase 1: Filtering and Selection
// ===================================

export async function filterPlaces(
  districtId: string,
  interests: string[],
  budget: number,
  travelerCount: number,
  excludedPlaceIds: string[] = [] // NEW: Excluded places
): Promise<Place[]> {
  try {
    // Map interests to tags
    const tagMap: { [key: string]: string[] } = {
      'Historical': ['historical', 'cultural'],
      'Art & Culture': ['art', 'cultural', 'museum'],
      'Entertainment': ['entertainment', 'fun', 'activities'],
      'Nature': ['nature', 'outdoor', 'scenic', 'beach'],
      'Food': ['dining', 'local-food', 'food'],
      'Shopping': ['shopping', 'market'],
    };

    // Flatten all relevant tags
    const relevantTags = interests.flatMap(
      (interest) => tagMap[interest] || []
    );

    // Build query
    let query = supabase
      .from('places')
      .select('*')
      .eq('district_id', districtId)
      .eq('is_active', true)
      .or(`category.eq.attraction,category.eq.dining`)
      .lte('avg_price', budget / travelerCount);

    // NEW: Exclude removed places
    if (excludedPlaceIds.length > 0) {
      query = query.not('id', 'in', `(${excludedPlaceIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by tags and sort by popularity/rating
    const filtered = (data || [])
      .filter((place) => {
        // Check if place has any relevant tags
        return place.tags.some((tag: string) =>
          relevantTags.includes(tag.toLowerCase())
        );
      })
      .sort((a, b) => {
        // Sort by popularity score first, then rating
        if (b.popularity_score !== a.popularity_score) {
          return b.popularity_score - a.popularity_score;
        }
        return b.rating - a.rating;
      });

    // Return top 15 attractions
    return filtered.slice(0, 15);
  } catch (error) {
    console.error('Error filtering places:', error);
    return [];
  }
}

// ===================================
// Phase 2: Calculate Distance (Haversine Formula)
// ===================================

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculateTravelTime(distanceKm: number): number {
  // Time in minutes
  return Math.ceil((distanceKm / AVG_SPEED_KMH) * 60);
}

// ===================================
// Phase 3: Greedy Nearest Neighbor Routing
// ===================================

function orderPlacesByProximity(places: Place[]): Place[] {
  if (places.length === 0) return [];

  const ordered: Place[] = [];
  const remaining = [...places];

  // Start with the first place (highest popularity)
  let current = remaining.shift()!;
  ordered.push(current);

  // Greedy algorithm: always pick nearest unvisited place
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const distance = calculateDistance(
        current.latitude,
        current.longitude,
        remaining[i].latitude,
        remaining[i].longitude
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    current = remaining[nearestIndex];
    remaining.splice(nearestIndex, 1);
    ordered.push(current);
  }

  return ordered;
}

// ===================================
// Phase 4: Check Opening Hours
// ===================================

function isPlaceOpen(
  place: Place,
  date: Date,
  time: number // hour in 24h format
): boolean {
  const dayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const dayName = dayNames[date.getDay()];

  // Check if closed on this day
  if (place.opening_hours.closed?.includes(dayName)) {
    return false;
  }

  const hours = place.opening_hours[dayName as keyof OpeningHours];
  if (!hours || typeof hours !== 'string') return false;

  // Parse hours (format: "09:00-18:00")
  const [openStr, closeStr] = hours.split('-');
  const openHour = parseInt(openStr.split(':')[0]);
  const closeHour = parseInt(closeStr.split(':')[0]);

  return time >= openHour && time < closeHour;
}

// ===================================
// Phase 5: Generate Daily Itinerary
// ===================================

export async function generateItinerary(
  places: Place[],
  startDate: Date,
  dayCount: number,
  districtId: string
): Promise<TripItinerary> {
  // Order places by proximity
  const orderedPlaces = orderPlacesByProximity(places);

  const days: DayItinerary[] = [];
  let placeIndex = 0;
  let totalCost = 0;

  for (let dayNum = 0; dayNum < dayCount; dayNum++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + dayNum);

    const daySlots: TimeSlot[] = [];
    let currentTime = new Date(currentDate);
    currentTime.setHours(START_TIME, 0, 0, 0);
    let dayCost = 0;

    let lunchAdded = false;

    while (
      placeIndex < orderedPlaces.length &&
      currentTime.getHours() < END_TIME
    ) {
      const place = orderedPlaces[placeIndex];

      // Check if it's lunch time
      if (
        currentTime.getHours() >= LUNCH_TIME &&
        !lunchAdded &&
        place.category !== 'dining'
      ) {
        // Find nearby dining place
        const diningPlace = await findNearbyDining(
          districtId,
          daySlots.length > 0
            ? daySlots[daySlots.length - 1].place
            : place
        );

        if (diningPlace) {
          const lunchStart = new Date(currentTime);
          const lunchEnd = new Date(currentTime);
          lunchEnd.setMinutes(lunchEnd.getMinutes() + LUNCH_DURATION);

          daySlots.push({
            place: diningPlace,
            startTime: lunchStart,
            endTime: lunchEnd,
            type: 'dining',
          });

          dayCost += diningPlace.avg_price;
          currentTime = lunchEnd;
          lunchAdded = true;
          continue;
        }
      }

      // Check if place is open
      if (!isPlaceOpen(place, currentDate, currentTime.getHours())) {
        placeIndex++;
        continue;
      }

      // Calculate travel time from previous location
      let travelTime = 0;
      if (daySlots.length > 0) {
        const prevPlace = daySlots[daySlots.length - 1].place;
        const distance = calculateDistance(
          prevPlace.latitude,
          prevPlace.longitude,
          place.latitude,
          place.longitude
        );
        travelTime = calculateTravelTime(distance) + TRAVEL_BUFFER;

        // Add travel slot
        const travelStart = new Date(currentTime);
        currentTime.setMinutes(currentTime.getMinutes() + travelTime);

        if (currentTime.getHours() >= END_TIME) break;
      }

      // Add activity slot
      const activityStart = new Date(currentTime);
      const activityEnd = new Date(currentTime);
      activityEnd.setMinutes(
        activityEnd.getMinutes() + place.suggested_duration
      );

      // Check if activity fits in the day
      if (activityEnd.getHours() >= END_TIME) {
        break;
      }

      daySlots.push({
        place,
        startTime: activityStart,
        endTime: activityEnd,
        type: place.category === 'dining' ? 'dining' : 'attraction',
        travelTime: travelTime > 0 ? travelTime : undefined,
      });

      dayCost += place.avg_price;
      currentTime = activityEnd;
      placeIndex++;
    }

    days.push({
      day: dayNum + 1,
      date: currentDate,
      slots: daySlots,
      totalCost: dayCost,
    });

    totalCost += dayCost;
  }

  return {
    days,
    totalCost,
    totalPlaces: placeIndex,
  };
}

// ===================================
// Helper: Find Nearby Dining
// ===================================

async function findNearbyDining(
  districtId: string,
  currentPlace: Place
): Promise<Place | null> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('district_id', districtId)
      .eq('category', 'dining')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) return null;

    // Find closest dining place
    let closest = data[0];
    let minDistance = calculateDistance(
      currentPlace.latitude,
      currentPlace.longitude,
      data[0].latitude,
      data[0].longitude
    );

    for (const place of data) {
      const distance = calculateDistance(
        currentPlace.latitude,
        currentPlace.longitude,
        place.latitude,
        place.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = place;
      }
    }

    return closest;
  } catch (error) {
    console.error('Error finding dining place:', error);
    return null;
  }
}

// ===================================
// Main Generation Function
// ===================================

export async function generateTrip(
  districtId: string,
  interests: string[],
  budget: number,
  travelerCount: number,
  startDate: Date,
  dayCount: number,
  excludedPlaceIds: string[] = [] // NEW: Places to exclude
): Promise<TripItinerary> {
  // Phase 1: Filter places (excluding removed ones)
  const places = await filterPlaces(
    districtId,
    interests,
    budget,
    travelerCount,
    excludedPlaceIds // Pass excluded IDs
  );

  // Phase 2-5: Generate itinerary
  const itinerary = await generateItinerary(
    places,
    startDate,
    dayCount,
    districtId
  );

  return itinerary;
}