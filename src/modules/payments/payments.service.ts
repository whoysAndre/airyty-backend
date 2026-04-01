import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async pay(bookingId: string, guestId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.guestId !== guestId) throw new ForbiddenException('Access denied');
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay for a cancelled booking');
    }
    if (booking.payment) {
      throw new BadRequestException('This booking has already been paid');
    }

    // Simular pago: crear Payment como SUCCEEDED y confirmar la booking en una transacción
    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          bookingId,
          amount: booking.totalPrice,
          currency: 'usd',
          status: PaymentStatus.SUCCEEDED,
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      }),
    ]);

    return payment;
  }

  async findByBooking(bookingId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
      include: {
        booking: {
          select: { guestId: true, listing: { select: { hostId: true } } },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    const isGuest = payment.booking.guestId === userId;
    const isHost = payment.booking.listing.hostId === userId;

    if (!isGuest && !isHost) throw new ForbiddenException('Access denied');

    return payment;
  }

  async refund(bookingId: string, guestId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.booking.guestId !== guestId) throw new ForbiddenException('Access denied');
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Payment has already been refunded');
    }
    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Only succeeded payments can be refunded');
    }

    const [updatedPayment] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { bookingId },
        data: { status: PaymentStatus.REFUNDED },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      }),
    ]);

    return updatedPayment;
  }
}
