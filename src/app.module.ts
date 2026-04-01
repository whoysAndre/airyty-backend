import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { CommonModule } from './modules/common/common.module';
import { ListingsModule } from './modules/listings/listings.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { FilesModule } from './modules/files/files.module';
import { UsersModule } from './modules/users/users.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    CommonModule,
    ListingsModule,
    CloudinaryModule,
    FilesModule,
    UsersModule,
    BookingsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
