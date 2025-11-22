// constants/DistrictImages.ts
// This file manages all district images from the assets folder

import { ImageSourcePropType } from 'react-native';

export const DISTRICT_IMAGES: { [key: string]: ImageSourcePropType } = {
  'Baling': require('../assets/images/Baling.jpeg'),
  'Bandar Baharu': require('../assets/images/Bandar Baharu.jpeg'),
  'Kota Setar': require('../assets/images/Kota Setar.jpeg'),
  'Kuala Muda': require('../assets/images/Kuala Muda.jpg'),
  'Kubang Pasu': require('../assets/images/Kubang Pasu.jpeg'),
  'Kulim': require('../assets/images/Kulim.jpeg'),
  'Langkawi': require('../assets/images/Langkawi.jpeg'),
  'Padang Terap': require('../assets/images/Padang Terap.jpeg'),
  'Pendang': require('../assets/images/Pendang.jpg'),
  'Pokok Sena': require('../assets/images/Pokok Sena.jpeg'),
  'Sik': require('../assets/images/Sik.jpg'),
  'Yan': require('../assets/images/Yan.jpeg'),
};

// Helper function to get district image
export const getDistrictImage = (districtName: string): ImageSourcePropType | null => {
  return DISTRICT_IMAGES[districtName] || null;
};

// Get all district names with images
export const getDistrictNamesWithImages = (): string[] => {
  return Object.keys(DISTRICT_IMAGES);
};

// ===================================
// Storage Configuration for Place Images
// ===================================

// IMPORTANT: Replace with your actual Supabase project URL
// Find it in: Supabase Dashboard > Settings > API > Project URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export const STORAGE_CONFIG = {
  BASE_URL: `${SUPABASE_URL}/storage/v1/object/public`,
  BUCKET_NAME: 'places',
};

/**
 * Constructs full image URL from relative path
 * @example getImageUrl('langkawi/accommodations/datai_langkawi.jpg')
 * Returns: https://your-project.supabase.co/storage/v1/object/public/places/langkawi/accommodations/datai_langkawi.jpg
 */
export function getImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  
  const cleanPath = relativePath.startsWith('/') 
    ? relativePath.substring(1) 
    : relativePath;
  
  const fullUrl = `${STORAGE_CONFIG.BASE_URL}/${STORAGE_CONFIG.BUCKET_NAME}/${cleanPath}`;
  
  // Debug: Log the URL to check if it's correct
  console.log('Image URL:', fullUrl);
  
  return fullUrl;
}