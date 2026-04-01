import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';
import { ChangeEmailDto } from './dto/change-email.dto';
import { FilesService } from '../files/files.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  async changeRole(email: string) {
    const existByUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existByUser) throw new NotFoundException('User not found');

    if (existByUser.role === 'HOST') {
      throw new BadRequestException('User already has HOST role');
    }

    existByUser.role = 'HOST';

    await this.prisma.user.update({
      where: {
        email,
      },
      data: {
        role: 'HOST',
      },
    });

    return {
      status: 200,
      message: 'Change Role successfully',
    };
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto, image: any) {
    const { name } = updateUserDto;

    const existByUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existByUser) throw new NotFoundException('User not found');

    let avatarUrl = existByUser.avatarUrl;
    let publicImageUrl = existByUser.puublicImageUrl;

    if (image) {
      if (existByUser.puublicImageUrl) {
        const result = await this.filesService.updateImage(
          existByUser.puublicImageUrl,
          image,
        );
        avatarUrl = result.url;
        publicImageUrl = result.public_id;
      } else {
        const result = await this.filesService.uploadImageToCloudinary(image);
        avatarUrl = result.url;
        publicImageUrl = result.public_id;
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        avatarUrl,
        puublicImageUrl: publicImageUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    return {
      status: 200,
      message: 'Profile updated successfully',
      user: updated,
    };
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const { confirmPassword, password, newPassword } = changePasswordDto;

    const existByUser = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!existByUser) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(password, existByUser.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (password !== confirmPassword)
      throw new BadRequestException('Error de crendenciales');

    const passwordLatest = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        passwordHash: passwordLatest,
      },
    });

    return {
      status: 200,
      message: 'Change Password succesfully',
    };
  }

  async changeEmail(id: string, changeEmailDto: ChangeEmailDto) {
    const existByUser = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!existByUser) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(
      changeEmailDto.password,
      existByUser.passwordHash,
    );
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        email: changeEmailDto.email,
      },
    });

    return {
      status: 200,
      message: 'Change Email succesfully',
    };
  }
}
