import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLES } from '../../decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    if (!roles) return true;

    if (roles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (roles.includes(user.role)) {
      return true;
    }

    throw new ForbiddenException(`User need a valid role: [${roles}]`);
  }
}
