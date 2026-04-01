import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from "@nestjs/passport"
import { JwtModule } from "@nestjs/jwt"
import { envs } from 'src/config/envs';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { FilesModule } from '../files/files.module';


@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UserRoleGuard],
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: envs.secretToken,
      signOptions: {
        expiresIn: '2h'
      }
    }),
    PrismaModule,
    FilesModule
  ],
  exports: [
    UserRoleGuard,
    PassportModule
  ]
})
export class AuthModule { }
