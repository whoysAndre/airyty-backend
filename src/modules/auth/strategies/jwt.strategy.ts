import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { envs } from "src/config/envs";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { JwtPayload } from "../interfaces/payload.interface";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {


  constructor(
    private readonly prisma: PrismaService
  ) {
    super({
      secretOrKey: envs.secretToken,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    })
  }

  async validate(payload: JwtPayload) {

    const { email } = payload;

    const user = await this.prisma.user.findUnique({
      where: {
        email
      }
    });
    if (!user)
      throw new UnauthorizedException('Token not valid');

    return user;
  }

}