import { BookingStatus } from '@prisma/client';

export interface BookingGuest {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface BookingListing {
  id: string;
  title: string;
  city: string;
  country: string;
  pricePerNight: string;
}

export interface Booking {
  id: string;
  guestId: string;
  listingId: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
  totalPrice: string;
  status: BookingStatus;
  createdAt: Date;
}

export interface BookingWithRelations extends Booking {
  guest: BookingGuest;
  listing: BookingListing;
}
