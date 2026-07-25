export type BookingStatus = 'pending' | 'confirmed' | 'arrived' | 'seated' | 'completed';

export interface Booking {
  id: string;
  guest_name: string;
  guests: number;
  phone_code: string;
  phone: string;
  date: string;
  time: string;
  seat: string;
  booking_type: 'table' | 'room';
  status: BookingStatus;
  special_request?: string;
}
