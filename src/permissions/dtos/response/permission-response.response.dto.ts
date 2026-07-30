import { Expose, Type } from 'class-transformer';
import { RolePermissionResponseDto } from 'src/permissions/dtos/response/role-permission.response.dto';

export class PermissionResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  code: string;

  @Expose()
  module: string;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;

  @Expose()
  @Type(() => RolePermissionResponseDto)
  rolePermissions: RolePermissionResponseDto[];
}
