import { create } from 'zustand';

interface Venue {
  id: string;
  name: string;
  location: string;
  sport: string;
  image?: string;
  rating: number;
  smart_recording: boolean;
  base_price: number;
  super_video_price: number;
  amenities: string[];
  slots: TimeSlot[];
}

interface TimeSlot {
  time: string;
  available: boolean;
  price: number;
}

interface Booking {
  id: string;
  venue_id: string;
  venue_name: string;
  date: string;
  time_slot: string;
  sport: string;
  super_video_enabled: boolean;
  total_price: number;
  user_name: string;
  pin_code: string;
  status: string;
  video_status: string;
  video_url?: string;
  created_at: string;
}

interface Video {
  id: string;
  booking_id: string;
  venue_name: string;
  sport: string;
  thumbnail: string;
  video_url: string;
  duration: number;
  likes: number;
  views: number;
  user_name: string;
  created_at: string;
}

interface AppState {
  selectedSport: string;
  setSelectedSport: (sport: string) => void;
  venues: Venue[];
  setVenues: (venues: Venue[]) => void;
  bookings: Booking[];
  setBookings: (bookings: Booking[]) => void;
  videos: Video[];
  setVideos: (videos: Video[]) => void;
  userName: string;
  setUserName: (name: string) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedSport: 'All',
  setSelectedSport: (sport) => set({ selectedSport: sport }),
  venues: [],
  setVenues: (venues) => set({ venues }),
  bookings: [],
  setBookings: (bookings) => set({ bookings }),
  videos: [],
  setVideos: (videos) => set({ videos }),
  userName: 'Guest User',
  setUserName: (userName) => set({ userName }),
}));
