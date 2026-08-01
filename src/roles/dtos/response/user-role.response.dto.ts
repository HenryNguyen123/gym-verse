import { Expose, Type } from 'class-transformer';
import { RoleResponseDto } from 'src/roles/dtos/response/role.response.dto';

export class UserRoleResponseDto {
  @Expose()
  @Type(() => RoleResponseDto)
  role!: RoleResponseDto;
}
