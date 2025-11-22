import { Stack } from 'expo-router';

export default function TripLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="select-district" />
      <Stack.Screen name="select-traveler" />
      <Stack.Screen name="select-date" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="review" />
      <Stack.Screen name="generate" />
    </Stack>
  );
}