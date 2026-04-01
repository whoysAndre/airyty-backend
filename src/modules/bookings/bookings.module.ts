import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
  imports: [AuthModule, PrismaModule],
})
export class BookingsModule {}
