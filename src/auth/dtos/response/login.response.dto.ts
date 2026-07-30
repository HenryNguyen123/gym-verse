import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from 'src/users/dtos/response/user.response.dto';

export class LoginResponseDto {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;

  @Expose()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;
}
