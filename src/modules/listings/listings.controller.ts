import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingDto } from './dto/search-listing.dto';
import { DeleteImageDto } from './dto/delete-image.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RolesEnum } from '../auth/enums/roles.enum';
import type { User } from '../users/interfaces/user.interface';

const imageInterceptor = FilesInterceptor('images', 10, {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!file.mimetype.match(/^image\/(jpeg|png|jpg|webp|avif)$/)) {
      return callback(
        new BadRequestException('Only image files are allowed!'),
        false,
      );
    }
    callback(null, true);
  },
});

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // ── Public ───────────────────────────────────────────────────

  @Get()
  findAll(@Query() searchDto: SearchListingDto) {
    return this.listingsService.findAll(searchDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  // ── Host only ────────────────────────────────────────────────

  @Post()
  @Auth(RolesEnum.HOST)
  @UseInterceptors(imageInterceptor)
  create(
    @GetUser() user: User,
    @Body() createListingDto: CreateListingDto,
    @UploadedFiles() images: any[],
  ) {
    return this.listingsService.create(user.id, createListingDto, images ?? []);
  }

  @Get('host/my-listings')
  @Auth(RolesEnum.HOST)
  findByHost(@GetUser() user: User) {
    return this.listingsService.findByHost(user.id);
  }

  @Patch(':id')
  @Auth(RolesEnum.HOST)
  update(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updateListingDto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, user.id, updateListingDto);
  }

  @Post(':id/images')
  @Auth(RolesEnum.HOST)
  @UseInterceptors(imageInterceptor)
  addImages(
    @Param('id') id: string,
    @GetUser() user: User,
    @UploadedFiles() images: any[],
  ) {
    return this.listingsService.addImages(id, user.id, images ?? []);
  }

  @Delete(':id/images')
  @Auth(RolesEnum.HOST)
  deleteImage(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() deleteImageDto: DeleteImageDto,
  ) {
    return this.listingsService.deleteImage(
      id,
      user.id,
      deleteImageDto.publicId,
    );
  }

  @Patch(':id/toggle-active')
  @Auth(RolesEnum.HOST)
  toggleActive(@Param('id') id: string, @GetUser() user: User) {
    return this.listingsService.toggleActive(id, user.id);
  }

  @Delete(':id')
  @Auth(RolesEnum.HOST)
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.listingsService.remove(id, user.id);
  }
}
