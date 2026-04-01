import {
  Controller,
  Body,
  Patch,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import type { User } from './interfaces/user.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('change-role')
  @Auth()
  changeRole(@GetUser() user: User) {
    return this.usersService.changeRole(user.email);
  }

  @Patch('change-password')
  @Auth()
  changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, changePasswordDto);
  }

  @Patch('update-profile')
  @Auth()
  @UseInterceptors(
    FileInterceptor('image', {
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
    }),
  )
  updateProfile(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() image: any,
  ) {
    return this.usersService.updateProfile(user.id, updateUserDto, image);
  }
}
