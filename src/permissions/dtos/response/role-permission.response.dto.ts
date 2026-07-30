import { Expose, Type } from 'class-transformer';
import { RoleResponseDto } from 'src/roles/dtos/response/role.response.dto';

export class RolePermissionResponseDto {
  @Expose()
  roleId: number;

  @Expose()
  permissionId: number;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;

  @Expose()
  @Type(() => RoleResponseDto)
  role: RoleResponseDto;
}
