import { Expose } from 'class-transformer';
import { UserResponseDto } from 'src/users/dtos/response/user.response.dto';

export class PaginationUsersResponseDto {
  @Expose()
  meta!: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };

  @Expose()
  data!: UserResponseDto[];
}
