import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesModule } from '../files/files.module';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService],
  imports: [AuthModule, PrismaModule, FilesModule],
})
export class ListingsModule {}
