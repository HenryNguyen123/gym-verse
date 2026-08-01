import { Expose, Type } from 'class-transformer';
import { ProfileResponseDto } from 'src/users/dtos/response/profile.respose.dto';
import { UserRoleResponseDto } from 'src/roles/dtos/response/user-role.response.dto';

export class UserResponseDto {
  @Expose()
  userName!: string;

  @Expose()
  email!: string;

  @Expose()
  isActive!: boolean;

  @Expose()
  isVerified!: boolean;

  @Expose()
  status!: string;

  @Expose()
  failedLoginAttempts!: number;

  @Expose()
  lockedUntil?: Date;

  @Expose()
  lastLoginAt?: Date;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  @Type(() => ProfileResponseDto)
  profile!: ProfileResponseDto;

  @Expose()
  @Type(() => UserRoleResponseDto)
  userRole!: UserRoleResponseDto[];
}
