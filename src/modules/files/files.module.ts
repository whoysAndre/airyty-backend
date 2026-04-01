import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  providers: [FilesService],
  controllers: [FilesController],
  imports: [CloudinaryModule],
  exports: [FilesService]
})
export class FilesModule { }
