//constants/Storage.ts

export const STORAGE_CONFIG = {
  //BASE_URL: 'https://your-project-id.supabase.co/storage/v1/object/public' <-- I change this
  BASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL + '/storage/v1/object/public', //<-- with this
  BUCKET_NAME: 'places',
};

/**
 * Constructs full image URL from relative path
 * @param relativePath - Path stored in database (e.g., "kota-setar/historical/zahir_mosque.jpg")
 * @returns Full URL to image
 */
export function getImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  
  // Remove leading slash if present
  const cleanPath = relativePath.startsWith('/') 
    ? relativePath.substring(1) 
    : relativePath;
  
  return `${STORAGE_CONFIG.BASE_URL}/${STORAGE_CONFIG.BUCKET_NAME}/${cleanPath}`;
}

/**
 * Generates optimized image URL with transformations
 * @param relativePath - Path stored in database
 * @param options - Image transformation options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  relativePath: string | null | undefined,
  options?: {
    width?: number;
    height?: number;
    quality?: number; // 1-100
    format?: 'webp' | 'jpg' | 'png';
  }
): string | null {
  const baseUrl = getImageUrl(relativePath);
  if (!baseUrl) return null;
  
  // Supabase supports image transformations
  // Add query parameters for optimization
  const params = new URLSearchParams();
  if (options?.width) params.append('width', options.width.toString());
  if (options?.height) params.append('height', options.height.toString());
  if (options?.quality) params.append('quality', options.quality.toString());
  if (options?.format) params.append('format', options.format);
  
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}