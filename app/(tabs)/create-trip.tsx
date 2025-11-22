import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function CreateTripScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/trip/select-district');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
}
