import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { Permissions } from 'src/permissions/decorators/permission.decorator';
import { RolesGuard } from 'src/roles/guards/roles.guard';
import { PermissionsGuard } from 'src/permissions/guards/permissions.guard';
import { RoleEnum } from 'src/roles/enums/role.enum';

export function Auth(roles?: RoleEnum[], permissions?: string[]) {
  return applyDecorators(
    Roles(...(roles || [])),
    Permissions(...(permissions || [])),
    UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard),
  );
}
