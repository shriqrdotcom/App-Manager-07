export type BookingStatus = 'pending' | 'confirmed' | 'arrived' | 'seated' | 'completed';
export type BookingType = 'table' | 'room';
export type BookingSource = 'phone' | 'walk-in' | 'whatsapp' | 'other';

export interface Booking {
  id: string;
  guest_name: string;
  guests: number;
  phone_code: string;
  phone: string;
  date: string;
  time: string;
  seat: string;
  booking_type: BookingType;
  status: BookingStatus;
  special_request?: string;
}

export interface CreateBookingInput {
  restaurant_id: string;
  guest_name: string;
  phone_code: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  booking_type: BookingType;
  seating_area: string;
  seat: string;
  status: 'pending' | 'confirmed';
  source: BookingSource;
  special_request?: string;
  staff_note?: string;
}
