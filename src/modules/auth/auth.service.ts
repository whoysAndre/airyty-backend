import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { FilesService } from '../files/files.service';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,

    @Inject(JwtService)
    private readonly jwtService: JwtService,

    private readonly fileService: FilesService,

  ) { }

  async register(createUserDto: CreateUserDto, image: any) {

    const { password, email, ...rest } = createUserDto;

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(password, 10);

    let imageUrl: string | undefined;
    let publicUrl: string | undefined;

    if (image) {
      const uploadResult = await this.fileService.uploadImageToCloudinary(image);
      imageUrl = uploadResult.url;
      publicUrl = uploadResult.public_id;
    }

    const user = await this.prisma.user.create({
      data: { ...rest, email, passwordHash, avatarUrl: imageUrl, puublicImageUrl: publicUrl },
    });

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: this.getJwtToken({ email: user.email }),
    };
  }

  async login(loginDto: LoginUserDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: this.getJwtToken({ email: user.email }),
    };
  }

  private getJwtToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }
}