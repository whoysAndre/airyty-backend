import { Controller, Delete, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class FilesController {

  constructor(
    private readonly filesService: FilesService
  ) { }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(@UploadedFile() file: any) {
    return this.filesService.uploadImageToCloudinary(file);
  }

  @Put('update/:publicId')
  @UseInterceptors(FileInterceptor('file'))
  updateFile(@Param('publicId') publicId: string, @UploadedFile() file: any) {
    return this.filesService.updateImage(publicId, file);
  }

  @Delete(':publicId')
  deleteFile(@Param('publicId') publicId: string) {
    return this.filesService.deleteImage(publicId);
  }

}
