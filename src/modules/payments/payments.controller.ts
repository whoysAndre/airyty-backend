import { Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RolesEnum } from '../auth/enums/roles.enum';
import type { User } from '../users/interfaces/user.interface';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('booking/:bookingId')
  @Auth(RolesEnum.GUEST)
  pay(@Param('bookingId') bookingId: string, @GetUser() user: User) {
    return this.paymentsService.pay(bookingId, user.id);
  }

  @Get('booking/:bookingId')
  @Auth()
  findByBooking(@Param('bookingId') bookingId: string, @GetUser() user: User) {
    return this.paymentsService.findByBooking(bookingId, user.id);
  }

  @Post('booking/:bookingId/refund')
  @Auth(RolesEnum.GUEST)
  refund(@Param('bookingId') bookingId: string, @GetUser() user: User) {
    return this.paymentsService.refund(bookingId, user.id);
  }
}
