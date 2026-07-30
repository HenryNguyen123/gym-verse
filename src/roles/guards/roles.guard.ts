import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RoleEnum } from 'src/roles/enums/role.enum';
import { ForbiddenException } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { ROLES_KEY } from 'src/roles/decorators/roles.decorator';
import { IPayloadJWTLogin } from 'src/auth/interfaces/login.interface';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as IPayloadJWTLogin;
    if (!user) throw new ForbiddenException('Unauthorized');
    return user.roleCode.some((role: RoleEnum) => requiredRoles.includes(role));
  }
}
