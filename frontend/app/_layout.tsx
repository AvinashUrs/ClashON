import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAdminAuthStore } from '../store/adminAuthStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdminAuthenticated = useAdminAuthStore((state) => state.isAdminAuthenticated);

  useEffect(() => {
    const inUserTabs = segments[0] === '(tabs)';
    const inAdminSection = segments[0] === 'admin';
    const inLoginPage = segments[0] === 'login';
    const inVenuePage = segments[0] === 'venue';
    const inCheckout = segments[0] === 'checkout';
    const inBookingSuccess = segments[0] === 'booking-success';

    setTimeout(() => {
      // If admin is logged in
      if (isAdminAuthenticated) {
        // If not in admin section, redirect to admin dashboard
        if (!inAdminSection) {
          router.replace('/admin/dashboard');
        }
        return;
      }

      // If user is logged in
      if (isAuthenticated) {
        // Allow access to tabs, venue, checkout, booking-success
        if (inLoginPage) {
          router.replace('/(tabs)');
        }
        return;
      }

      // Not authenticated at all - go to login
      if (!inLoginPage) {
        router.replace('/login');
      }
    }, 50);
  }, [isAuthenticated, isAdminAuthenticated, segments]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="venue/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
        <Stack.Screen name="booking-success" options={{ presentation: 'modal' }} />
        <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="admin/venues" options={{ headerShown: false }} />
        <Stack.Screen name="admin/users" options={{ headerShown: false }} />
        <Stack.Screen name="admin/bookings" options={{ headerShown: false }} />
        <Stack.Screen name="admin/videos" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
