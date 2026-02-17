import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(tabs)';

    setTimeout(() => {
      if (!isAuthenticated && inAuthGroup) {
        router.replace('/login');
      } else if (isAuthenticated && !inAuthGroup && segments[0] !== 'venue' && segments[0] !== 'checkout' && segments[0] !== 'booking-success') {
        router.replace('/(tabs)');
      } else if (!isAuthenticated && !inAuthGroup && segments[0] !== 'login') {
        router.replace('/login');
      }
    }, 50);
  }, [isAuthenticated, segments]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="venue/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
        <Stack.Screen name="booking-success" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
