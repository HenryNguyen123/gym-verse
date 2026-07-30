/* eslint-disable @typescript-eslint/require-await */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { RoleCode } from 'src/auth/enums/role-code.enum';
import { IJwtPayload } from 'src/auth/interfaces/jwt.interface';

@Injectable()
export class RoleAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const user = req['user'] as IJwtPayload;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const role = user.roleCode as RoleCode;

    const isAdmin =
      role.includes(RoleCode.ADMIN) || role.includes(RoleCode.SUPERADMIN);

    if (!isAdmin) {
      throw new ForbiddenException('Member does not have permission');
    }

    return true;
  }
}
