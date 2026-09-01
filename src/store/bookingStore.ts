import { create } from 'zustand';

export interface BookingItem {
  ventureId: string;
  title: string;
  participants: number;
  totalPrice: number;
  bookingDate: string;
}

interface BookingState {
  bookings: BookingItem[];
  addBooking: (booking: BookingItem) => void;
  removeBooking: (ventureId: string) => void;
  clearBookings: () => void;
  getTotalPrice: () => number;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  addBooking: (booking) =>
    set((state) => ({ bookings: [...state.bookings, booking] })),
  removeBooking: (ventureId) =>
    set((state) => ({
      bookings: state.bookings.filter((b) => b.ventureId !== ventureId),
    })),
  clearBookings: () => set({ bookings: [] }),
  getTotalPrice: () =>
    get().bookings.reduce((sum, b) => sum + b.totalPrice, 0),
}));
