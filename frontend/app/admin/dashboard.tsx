import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface DashboardStats {
  total_users: number;
  total_venues: number;
  total_bookings: number;
  total_videos: number;
  confirmed_bookings: number;
  completed_bookings: number;
  total_revenue: number;
  recent_bookings: any[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const admin = useAdminAuthStore((state) => state.admin);
  const adminLogout = useAdminAuthStore((state) => state.adminLogout);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = () => {
    adminLogout();
    router.replace('/login');
  };

  const menuItems = [
    { title: 'Venues', subtitle: 'Manage courts & facilities', icon: 'business', route: '/admin/venues', count: stats?.total_venues },
    { title: 'Users', subtitle: 'View user accounts', icon: 'people', route: '/admin/users', count: stats?.total_users },
    { title: 'Bookings', subtitle: 'All reservations', icon: 'calendar', route: '/admin/bookings', count: stats?.total_bookings },
    { title: 'Videos', subtitle: 'Manage highlights', icon: 'videocam', route: '/admin/videos', count: stats?.total_videos },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0A0F1E', '#1a1f35', '#0A0F1E']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0F1E', '#1a1f35', '#0A0F1E']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.adminName}>{admin?.name || 'Admin'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#f59e0b" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
          }
        >
          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient colors={['#f59e0b', '#dc2626']} style={styles.statGradient}>
                <Ionicons name="cash-outline" size={28} color="#fff" />
                <Text style={styles.statValue}>₹{stats?.total_revenue?.toLocaleString() || 0}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.statGradient}>
                <Ionicons name="calendar-outline" size={28} color="#fff" />
                <Text style={styles.statValue}>{stats?.total_bookings || 0}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.statGradient}>
                <Ionicons name="checkmark-circle-outline" size={28} color="#fff" />
                <Text style={styles.statValue}>{stats?.completed_bookings || 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.statGradient}>
                <Ionicons name="time-outline" size={28} color="#fff" />
                <Text style={styles.statValue}>{stats?.confirmed_bookings || 0}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuCard}
                onPress={() => router.push(item.route as any)}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={28} color="#f59e0b" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.count}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4a5568" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Activity */}
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {stats?.recent_bookings?.length ? (
            <View style={styles.recentList}>
              {stats.recent_bookings.map((booking, index) => (
                <View key={index} style={styles.recentItem}>
                  <View style={styles.recentIcon}>
                    <Ionicons name="calendar" size={20} color="#667eea" />
                  </View>
                  <View style={styles.recentContent}>
                    <Text style={styles.recentTitle}>{booking.venue_name}</Text>
                    <Text style={styles.recentSubtitle}>
                      {booking.user_name} • {booking.date} • {booking.time_slot}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, 
                    booking.status === 'completed' && styles.statusCompleted,
                    booking.status === 'cancelled' && styles.statusCancelled
                  ]}>
                    <Text style={styles.statusText}>{booking.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#4a5568" />
              <Text style={styles.emptyText}>No recent bookings</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8b9dc3',
    marginTop: 16,
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#8b9dc3',
  },
  adminName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCard: {
    width: '50%',
    padding: 6,
  },
  statGradient: {
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  menuGrid: {
    marginBottom: 24,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#8b9dc3',
    marginTop: 2,
  },
  menuBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  menuBadgeText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  recentList: {
    marginBottom: 24,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  recentSubtitle: {
    fontSize: 12,
    color: '#8b9dc3',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
  },
  emptyText: {
    color: '#4a5568',
    fontSize: 14,
    marginTop: 12,
  },
});
