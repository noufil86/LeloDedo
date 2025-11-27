import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read roles from @Roles()
    const requiredRoles =
      this.reflector.get<string[]>('roles', context.getHandler()) || [];

    if (requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'No user found on request. AuthGuard("jwt") did not run.',
      );
    }

    if (!user.role) {
      throw new ForbiddenException('User has no role assigned.');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Forbidden. Required: ${requiredRoles}, but you are: ${user.role}`,
      );
    }

    return true;
  }
}
