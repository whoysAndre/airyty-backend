import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(guestId: string, dto: CreateBookingDto) {
    const { listingId, checkIn, checkOut, guestCount } = dto;

    // ── 1. Validar que checkIn sea futuro y checkOut posterior a checkIn
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      throw new BadRequestException('Check-in date must be in the future');
    }
    if (checkOut <= checkIn) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    // ── 2. Verificar que el listing exista, esté activo y obtener su precio
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) throw new NotFoundException('Listing not found');
    if (!listing.isActive) {
      throw new BadRequestException('Listing is not available');
    }

    // ── 3. El host no puede reservar su propio listing
    if (listing.hostId === guestId) {
      throw new ForbiddenException('You cannot book your own listing');
    }

    // ── 4. Validar capacidad de huéspedes
    if (guestCount > listing.maxGuests) {
      throw new BadRequestException(
        `This listing allows a maximum of ${listing.maxGuests} guests`,
      );
    }

    // ── 5. Detectar solapamiento de fechas
    // Dos reservas se solapan si: existingCheckIn < newCheckOut AND existingCheckOut > newCheckIn
    // Solo bloqueamos reservas PENDING o CONFIRMED (CANCELLED y COMPLETED liberan el espacio)
    const conflict = await this.prisma.booking.findFirst({
      where: {
        listingId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
      },
    });

    if (conflict) {
      throw new BadRequestException(
        'Listing is not available for the selected dates',
      );
    }

    // ── 6. Calcular el precio total
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalPrice = Number(listing.pricePerNight) * nights;

    // ── 7. Crear la reserva
    return this.prisma.booking.create({
      data: {
        guestId,
        listingId,
        checkIn,
        checkOut,
        guestCount,
        totalPrice,
        status: BookingStatus.PENDING,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            pricePerNight: true,
          },
        },
      },
    });
  }

  // Reservas del guest autenticado
  async findGuestBookings(guestId: string) {
    return this.prisma.booking.findMany({
      where: { guestId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            images: true,
          },
        },
      },
    });
  }

  // Reservas de todos los listings del host autenticado
  async findHostBookings(hostId: string) {
    return this.prisma.booking.findMany({
      where: { listing: { hostId } },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: { id: true, title: true, city: true, country: true },
        },
        guest: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  // Detalle de una reserva — accesible por el guest o el host del listing
  async findOne(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            pricePerNight: true,
            hostId: true,
          },
        },
        guest: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const isGuest = booking.guestId === userId;
    const isHost = booking.listing.hostId === userId;

    if (!isGuest && !isHost) {
      throw new ForbiddenException('Access denied');
    }

    return booking;
  }

  // El host actualiza el status de una reserva (CONFIRMED, CANCELLED, COMPLETED)
  async updateStatus(id: string, hostId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { listing: { select: { hostId: true } } },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.listing.hostId !== hostId) {
      throw new ForbiddenException('Access denied');
    }

    // Validar transiciones de estado permitidas
    this.validateStatusTransition(booking.status, dto.status);

    return this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // El guest cancela su propia reserva
  async cancel(id: string, guestId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.guestId !== guestId) {
      throw new ForbiddenException('Access denied');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────

  private validateStatusTransition(
    current: BookingStatus,
    next: BookingStatus,
  ) {
    const allowed: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.CONFIRMED]: [
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.COMPLETED]: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException(
        `Cannot transition booking from ${current} to ${next}`,
      );
    }
  }
}
