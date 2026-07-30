import { Expose, Type } from 'class-transformer';
import { RoleResponseDto } from 'src/roles/dtos/response/role.response.dto';
import { ProfileResponseDto } from 'src/users/dtos/response/profile.respose.dto';

export class UserFindByIdRespose {
  @Expose()
  userName: string;

  @Expose()
  email: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;

  @Expose()
  @Type(() => ProfileResponseDto)
  profile: ProfileResponseDto;

  @Expose()
  @Type(() => RoleResponseDto)
  role: RoleResponseDto;
}
