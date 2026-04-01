import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [AuthModule, PrismaModule],
})
export class PaymentsModule {}
