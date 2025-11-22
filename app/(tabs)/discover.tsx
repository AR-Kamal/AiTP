// MaiKedah/app/(tabs)/discover.tsx

// -----------------------------------------------------------
// 1. IMPORTS & CONSTANTS
// -----------------------------------------------------------
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Local Utility Imports
import { supabase } from '../../lib/supabase';
import { getDistrictImage, getImageUrl } from '../../constants/DistrictImages';
import { KEDAH_DISTRICTS } from '../../constants/Districts';

// --- DIMENSIONS ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DISTRICT_CARD_WIDTH = SCREEN_WIDTH * 0.85;
const DISTRICT_CARD_HEIGHT = 400;
const CARD_MARGIN = 16;
const SNAP_INTERVAL = DISTRICT_CARD_WIDTH + CARD_MARGIN;

// --- INTERFACES (Types for fetched data) ---
interface Place {
  id: string;
  name: string;
  district_id: string;
  image_path: string | null;
  rating: number;
  popularity_score: number;
  category: string;
  district_name?: string;
}

interface Accommodation {
  id: string;
  name: string;
  district_id: string;
  image_path: string | null;
  rating: number;
  price_per_night: number;
  type: string;
  district_name?: string;
}

// --- STATIC DATA (DISTRICT DESCRIPTIONS) ---
const DISTRICT_DESCRIPTIONS: { [key: string]: string } = {
  'Kota Setar': 'The royal capital of Kedah, home to the majestic Zahir Mosque, one of Malaysia\'s most beautiful mosques. Explore rich Malay heritage at Balai Besar and witness the iconic Alor Setar Tower offering panoramic views of the paddy fields.',
  'Kubang Pasu': 'A charming border town gateway to Thailand, known for its vibrant cross-border trade. Experience authentic local culture, traditional markets, and the historic Bukit Kayu Hitam checkpoint connecting Malaysia and Thailand.',
  'Padang Terap': 'Nature lover\'s paradise featuring the stunning Pedu Lake, surrounded by lush rainforest and mountains. Perfect for eco-tourism, fishing, and discovering cascading waterfalls in the pristine Ulu Muda forest reserve.',
  'Langkawi': 'The Jewel of Kedah - a UNESCO Global Geopark with 99 tropical islands. Famous for pristine beaches, duty-free shopping, the iconic Sky Bridge, cable car rides, and legendary tales of Mahsuri. Malaysia\'s premier island destination.',
  'Kuala Muda': 'Coastal district blessed with beautiful beaches and rich fishing heritage. Home to the historic port town of Kuala Kedah, gateway to Langkawi, and serene beaches perfect for sunset watching and fresh seafood.',
  'Yan': 'Tranquil fishing district along the Straits of Malacca, renowned for exceptional seafood and traditional fishing villages. Experience authentic coastal Malay culture and watch traditional fishing boats in picturesque harbors.',
  'Pendang': 'The rice bowl of Kedah, vast emerald paddy fields stretching to the horizon. Witness traditional rice farming, visit the iconic Gunung Keriang limestone hill, and experience rural Malay village life at its most authentic.',
  'Sik': 'Mountainous district offering cool highland retreats and natural hot springs. Explore rubber and oil palm plantations, trek through jungle trails, and discover the therapeutic Sik Hot Springs amidst lush tropical vegetation.',
  'Baling': 'Highland district famous for the historic Baling Talks that shaped Malaysian independence. Adventure awaits with jungle trekking, waterfall exploration, and durian orchards. Home to beautiful mountainous landscapes and cool climate.',
  'Kulim': 'Modern industrial hub transforming into a high-tech corridor. Balance of urban development and nature with the scenic Gunung Bongsu hiking trails, traditional kampung charm, and the innovative Kulim Hi-Tech Park.',
  'Bandar Baharu': 'Peaceful coastal town with pristine beaches and traditional fishing communities. Escape the crowds, enjoy fresh seafood at local warungs, and experience authentic Malay coastal living by the Straits of Malacca.',
  'Pokok Sena': 'Agricultural heartland surrounded by endless paddy fields and fruit orchards. Discover rural tranquility, traditional Malay kampungs, and the simple beauty of countryside living. Famous for seasonal fruit harvests and local delicacies.',
};

// -----------------------------------------------------------
// 2. INLINE REUSABLE COMPONENTS (Memoized)
// -----------------------------------------------------------

interface SectionHeaderProps {
    title: string;
    subtitle: string;
    iconName: any;
    iconColor: string;
}
const SectionHeader = React.memo<SectionHeaderProps>(({ title, subtitle, iconName, iconColor }) => (
    <View style={styles.sectionHeader}>
        <View>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name={iconName} size={24} color={iconColor} />
    </View>
));

interface PlaceCardProps {
    place: Place;
    onPress: (id: string) => void;
    variant: 'trendy' | 'gem';
}
const PlaceCard = React.memo<PlaceCardProps>(({ place, onPress, variant }) => {
    const isTrendy = variant === 'trendy';
    const imageSource = place.image_path
        ? { uri: getImageUrl(place.image_path) || undefined }
        : getDistrictImage(place.district_name || '') || require('../../assets/images/icon.png');

    return (
        <TouchableOpacity
            style={isTrendy ? styles.trendyCard : styles.gemCard}
            onPress={() => onPress(place.id)}
            activeOpacity={0.9}
        >
            <Image source={imageSource} style={isTrendy ? styles.trendyImage : styles.gemImage} resizeMode="cover" />
            
            <LinearGradient
                colors={['transparent', isTrendy ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.7)']}
                style={isTrendy ? styles.trendyOverlay : styles.gemOverlay}
            >
                {isTrendy ? (
                    <View style={styles.trendyRatingBadge}>
                        <Ionicons name="star" size={14} color="#fbbf24" />
                        <Text style={styles.trendyRating}>{place.rating.toFixed(1)}</Text>
                    </View>
                ) : (
                    <View style={styles.gemBadge}>
                        <Ionicons name="diamond" size={10} color="#8b5cf6" />
                    </View>
                )}
                
                <Text style={isTrendy ? styles.trendyName : styles.gemName} numberOfLines={2}>
                    {place.name}
                </Text>

                {/* Footer/District Info */}
                {isTrendy ? (
                    <Text style={styles.trendyDistrict} numberOfLines={1}>
                        {place.district_name}
                    </Text>
                ) : (
                    <View style={styles.gemFooter}>
                        <Text style={styles.gemDistrict} numberOfLines={1}>
                            {place.district_name}
                        </Text>
                        <View style={styles.gemRating}>
                            <Ionicons name="star" size={10} color="#fbbf24" />
                            <Text style={styles.gemRatingText}>{place.rating.toFixed(1)}</Text>
                        </View>
                    </View>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
});

interface AccommodationCardProps {
    accommodation: Accommodation;
    onPress: (id: string) => void;
}
const AccommodationCard = React.memo<AccommodationCardProps>(({ accommodation, onPress }) => {
    const imageSource = accommodation.image_path
        ? { uri: getImageUrl(accommodation.image_path) || undefined }
        : getDistrictImage(accommodation.district_name || '') || require('../../assets/images/icon.png');
        
    return (
        <TouchableOpacity
            style={styles.accommodationCard}
            onPress={() => onPress(accommodation.id)}
            activeOpacity={0.9}
        >
            <Image source={imageSource} style={styles.accommodationImage} resizeMode="cover" />
            
            <View style={styles.accommodationInfo}>
                <View style={styles.accommodationHeader}>
                    <View style={styles.accommodationRating}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={styles.accommodationRatingText}>
                            {accommodation.rating.toFixed(1)}
                        </Text>
                    </View>
                    <View style={styles.accommodationTypeBadge}>
                        <Text style={styles.accommodationTypeText}>
                            {accommodation.type}
                        </Text>
                    </View>
                </View>
                <Text style={styles.accommodationName} numberOfLines={2}>
                    {accommodation.name}
                </Text>
                <Text style={styles.accommodationDistrict} numberOfLines={1}>
                    {accommodation.district_name}
                </Text>
                <View style={styles.accommodationFooter}>
                    <Text style={styles.accommodationPrice}>
                        RM {accommodation.price_per_night}
                    </Text>
                    <Text style={styles.accommodationPriceLabel}>/night</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});


// -----------------------------------------------------------
// 3. DATA FETCHING LOGIC (Consolidated into a Hook-like function)
// -----------------------------------------------------------

const useDiscoverData = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [trendyPlaces, setTrendyPlaces] = useState<Place[]>([]);
    const [hiddenGems, setHiddenGems] = useState<Place[]>([]);
    const [accommodations, setAccommodations] = useState<Accommodation[]>([]);

    const mapPlaceData = (place: any) => ({
        ...place,
        district_name: (place as any).districts?.name,
    });

    const fetchTrendyPlaces = async () => {
        const { data: allPlaces, error } = await supabase
            .from('places')
            .select('*, districts(name)')
            .eq('is_active', true)
            .eq('category', 'attraction')
            .gte('rating', 4.0)
            .order('rating', { ascending: false });

        if (error) { console.error('Error fetching trendy places:', error); return []; }

        return (allPlaces || [])
            .map(mapPlaceData)
            .sort(() => Math.random() - 0.5)
            .slice(0, 9);
    };

    const fetchHiddenGems = async () => {
        const { data: allPlaces, error } = await supabase
            .from('places')
            .select('*, districts(name)')
            .eq('is_active', true)
            .eq('category', 'attraction')
            .lt('popularity_score', 70)
            .gte('rating', 3.5)
            .order('rating', { ascending: false });

        if (error) { console.error('Error fetching hidden gems:', error); return []; }

        return (allPlaces || [])
            .map(mapPlaceData)
            .sort(() => Math.random() - 0.5)
            .slice(0, 7);
    };

    const fetchAccommodations = async () => {
        const { data: districts } = await supabase
            .from('districts')
            .select('id, name')
            .order('name');

        if (!districts) return [];

        const accommodationsPromises = districts.map(async (district) => {
            const { data } = await supabase
                .from('accommodations')
                .select('*')
                .eq('district_id', district.id)
                .eq('is_active', true)
                .order('rating', { ascending: false })
                .limit(1)
                .single();

            return data ? { ...data, district_name: district.name } : null;
        });

        return (await Promise.all(accommodationsPromises)).filter(Boolean) as Accommodation[];
    };
    
    const loadData = useCallback(async () => {
        const isRefreshing = refreshing;
        if (!isRefreshing) setLoading(true);

        try {
            const [
                trendyResult, 
                gemsResult, 
                accomsResult
            ] = await Promise.all([
                fetchTrendyPlaces(),
                fetchHiddenGems(),
                fetchAccommodations(),
            ]);

            setTrendyPlaces(trendyResult);
            setHiddenGems(gemsResult);
            setAccommodations(accomsResult);
        } catch (error) {
            console.error('Global Error loading discover data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    return {
        trendyPlaces,
        hiddenGems,
        accommodations,
        loading,
        refreshing,
        onRefresh,
    };
};


// -----------------------------------------------------------
// 4. MAIN SCREEN COMPONENT
// -----------------------------------------------------------

export default function DiscoverScreen() {
    const router = useRouter();
    const { trendyPlaces, hiddenGems, accommodations, loading, refreshing, onRefresh } = useDiscoverData();
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const infiniteDistricts = [
        ...KEDAH_DISTRICTS,
        ...KEDAH_DISTRICTS,
        ...KEDAH_DISTRICTS,
    ];

    const handleDistrictPress = (districtName: string) => {
        setSelectedDistrict(prev => prev === districtName ? null : districtName);
    };

    const handlePlacePress = (placeId: string) => {
        router.push(`/place-detail/${placeId}` as any);
    };

    const handleAccommodationPress = (accommodationId: string) => {
        // TODO: Navigate to accommodation detail
        console.log('Accommodation:', accommodationId);
    };

    const handleScroll = (event: any) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / SNAP_INTERVAL);
        setCurrentIndex(index);

        const totalDistricts = KEDAH_DISTRICTS.length;
        const totalCards = infiniteDistricts.length;
        const middleStart = totalDistricts;

        if (index < totalDistricts - 2) {
            scrollViewRef.current?.scrollTo({
                x: (middleStart + index) * SNAP_INTERVAL,
                animated: false,
            });
        } else if (index >= totalDistricts * 2 + 2) {
            const offset = index - (totalCards - totalDistricts);
            scrollViewRef.current?.scrollTo({
                x: (middleStart + offset) * SNAP_INTERVAL,
                animated: false,
            });
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Fetching exciting places in Kedah...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
            }
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover 🗺️</Text>
            </View>

            {/* Districts Carousel */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { paddingHorizontal: 24, marginBottom: 16 }]}>Explore Districts</Text>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    snapToInterval={SNAP_INTERVAL}
                    contentContainerStyle={styles.districtCarousel}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentOffset={{ x: KEDAH_DISTRICTS.length * SNAP_INTERVAL, y: 0 }}
                >
                    {infiniteDistricts.map((district, index) => {
                        const districtImage = getDistrictImage(district.name);
                        const isSelected = selectedDistrict === district.name;
                        
                        return (
                            <TouchableOpacity
                                key={`${district.id}-${index}`}
                                style={styles.districtCard}
                                activeOpacity={0.9}
                                onPress={() => handleDistrictPress(district.name)}
                            >
                                <Image
                                    source={districtImage || require('../../assets/images/icon.png')}
                                    style={styles.districtImage}
                                    resizeMode="cover"
                                />
                                
                                {isSelected && (
                                    <BlurView intensity={80} style={styles.blurOverlay}>
                                        <ScrollView 
                                            style={styles.descriptionScroll}
                                            showsVerticalScrollIndicator={false}
                                        >
                                            <Text style={styles.districtNameLarge}>{district.name}</Text>
                                            <Text style={styles.districtDescription}>
                                                {DISTRICT_DESCRIPTIONS[district.name] || 'No description available.'}
                                            </Text>
                                            <TouchableOpacity style={styles.exploreCTA}>
                                                <Text style={styles.exploreCTAText}>Explore {district.name}</Text>
                                                <Ionicons name="arrow-forward" size={18} color="white" />
                                            </TouchableOpacity>
                                        </ScrollView>
                                    </BlurView>
                                )}
                                
                                {!isSelected && (
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                                        style={styles.districtOverlay}
                                    >
                                        <Text style={styles.districtName}>{district.name}</Text>
                                        <View style={styles.tapToLearnMore}>
                                            <Ionicons name="information-circle-outline" size={16} color="white" />
                                            <Text style={styles.tapToLearnMoreText}>Tap to learn more</Text>
                                        </View>
                                    </LinearGradient>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Trendy Places */}
            {trendyPlaces.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader 
                        title="Trending Now" 
                        subtitle="Popular destinations in Kedah" 
                        iconName="trending-up" 
                        iconColor="#10b981" 
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalScroll}
                    >
                        {trendyPlaces.map((place) => (
                            <PlaceCard key={place.id} place={place} onPress={handlePlacePress} variant="trendy" />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Best Accommodations */}
            {accommodations.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader 
                        title="Best Stays" 
                        subtitle="Top accommodation in each district" 
                        iconName="bed-outline" 
                        iconColor="#f59e0b" 
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalScroll}
                    >
                        {accommodations.map((accommodation) => (
                            <AccommodationCard 
                                key={accommodation.id} 
                                accommodation={accommodation} 
                                onPress={handleAccommodationPress} 
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Hidden Gems */}
            {hiddenGems.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader 
                        title="Hidden Gems" 
                        subtitle="Discover Kedah's best-kept secrets" 
                        iconName="diamond-outline" 
                        iconColor="#8b5cf6" 
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalScroll}
                    >
                        {hiddenGems.map((place) => (
                            <PlaceCard key={place.id} place={place} onPress={handlePlacePress} variant="gem" />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Empty State */}
            {trendyPlaces.length === 0 && hiddenGems.length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="compass-outline" size={80} color="#d1d5db" />
                    <Text style={styles.emptyTitle}>No Places Found</Text>
                    <Text style={styles.emptySubtitle}>
                        Check back later or try refreshing the page.
                    </Text>
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

// -----------------------------------------------------------
// 5. STYLESHEET (Kept at the bottom for readability)
// -----------------------------------------------------------

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6b7280',
    },

    // Header
    header: {
        backgroundColor: 'white',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6', 
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6b7280',
    },

    // Section
    section: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#9ca3af',
    },
    horizontalScroll: {
        paddingLeft: 24,
        paddingRight: 12,
    },

    // District Carousel
    districtCarousel: {
        paddingHorizontal: (SCREEN_WIDTH - DISTRICT_CARD_WIDTH) / 2,
        paddingVertical: 8,
    },
    districtCard: {
        width: DISTRICT_CARD_WIDTH,
        height: DISTRICT_CARD_HEIGHT,
        marginHorizontal: 8,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    districtImage: {
        width: '100%',
        height: '100%',
    },
    districtOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
    },
    districtName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    tapToLearnMore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tapToLearnMoreText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },

    // Blur Overlay (District Card Selected State)
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: 24,
    },
    descriptionScroll: {
        flex: 1,
    },
    districtNameLarge: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    districtDescription: {
        fontSize: 16,
        lineHeight: 24,
        color: 'white',
        marginBottom: 24,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    exploreCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10b981',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignSelf: 'flex-start',
        gap: 8,
    },
    exploreCTAText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },

    // Trendy Places
    trendyCard: {
        width: 200,
        height: 240,
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    trendyImage: {
        width: '100%',
        height: '100%',
    },
    trendyOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    trendyRatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 6,
        gap: 4,
    },
    trendyRating: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
    },
    trendyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    trendyDistrict: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
    },

    // Accommodations
    accommodationCard: {
        width: 220,
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    accommodationImage: {
        width: '100%',
        height: 140,
    },
    accommodationInfo: {
        padding: 12,
    },
    accommodationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    accommodationRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    accommodationRatingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1f2937',
    },
    accommodationTypeBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    accommodationTypeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#d97706',
        textTransform: 'capitalize',
    },
    accommodationName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    accommodationDistrict: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 8,
    },
    accommodationFooter: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    accommodationPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10b981',
    },
    accommodationPriceLabel: {
        fontSize: 12,
        color: '#9ca3af',
        marginLeft: 2,
    },

    // Hidden Gems
    gemCard: {
        width: 160,
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    gemImage: {
        width: '100%',
        height: '100%',
    },
    gemOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    gemBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.9)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    gemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 6,
    },
    gemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gemDistrict: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.9)',
        flex: 1,
    },
    gemRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    gemRatingText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'white',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 24,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
    },
});