import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { setSession, session } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // defer navigation to ensure Root Layout has mounted
      setTimeout(() => router.replace('/splash'), 0);
    } else if (session && inAuthGroup) {
      // defer navigation to ensure Root Layout has mounted
      setTimeout(() => router.replace('/(tabs)'), 0);
    }
  }, [session, segments, router]);

  return <Slot />;
}
