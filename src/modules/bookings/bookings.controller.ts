import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RolesEnum } from '../auth/enums/roles.enum';
import type { User } from '../users/interfaces/user.interface';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ── Guest ────────────────────────────────────────────────────

  @Post()
  @Auth(RolesEnum.GUEST)
  create(@GetUser() user: User, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(user.id, createBookingDto);
  }

  @Get('my-bookings')
  @Auth(RolesEnum.GUEST)
  findGuestBookings(@GetUser() user: User) {
    return this.bookingsService.findGuestBookings(user.id);
  }

  @Patch(':id/cancel')
  @Auth(RolesEnum.GUEST)
  cancel(@Param('id') id: string, @GetUser() user: User) {
    return this.bookingsService.cancel(id, user.id);
  }

  // ── Host ─────────────────────────────────────────────────────

  @Get('host/incoming')
  @Auth(RolesEnum.HOST)
  findHostBookings(@GetUser() user: User) {
    return this.bookingsService.findHostBookings(user.id);
  }

  @Patch(':id/status')
  @Auth(RolesEnum.HOST)
  updateStatus(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, user.id, updateBookingStatusDto);
  }

  // ── Shared (guest + host) ────────────────────────────────────

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.bookingsService.findOne(id, user.id);
  }
}
