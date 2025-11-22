import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#10b981', '#34d399', '#6ee7b7']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="boat" size={60} color="white" />
        </View>
        
        <Text style={styles.title}>MaiKedah</Text>
        <Text style={styles.subtitle}>
          Swipe up to{'\n'}plan your Kedah{'\n'}adventure.
        </Text>

        <TouchableOpacity 
          style={styles.swipeIndicator}
          onPress={() => router.push('/(auth)/login')}
        >
          <Ionicons name="chevron-up" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    lineHeight: 36,
  },
  swipeIndicator: {
    marginTop: 60,
    padding: 16,
  },
});