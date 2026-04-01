import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  SetMetadata,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { GetUser } from './decorators/get-user.decorator';
import { Auth } from './decorators/auth.decorator';
import { RolesEnum } from './enums/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
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
  create(@Body() createAuthDto: CreateUserDto, @UploadedFile() image: any) {
    return this.authService.register(createAuthDto, image);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('private')
  @Auth(RolesEnum.HOST)
  me(@GetUser() user) {
    console.log(user);
    return {
      mesage: 'Ruta privada',
      user,
    };
  }

  @Get('test')
  @Auth()
  test() {
    return {
      msg: 'text',
    };
  }
}
