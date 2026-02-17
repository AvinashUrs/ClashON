import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Wait for navigation to be ready
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isNavigationReady) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (isAuthenticated && segments[0] === 'login') {
      // Redirect to app if authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isNavigationReady]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="venue/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
        <Stack.Screen name="booking-success" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
