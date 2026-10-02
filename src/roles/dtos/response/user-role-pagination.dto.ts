import { Expose } from 'class-transformer';
import { UserRoleResponseDto } from 'src/roles/dtos/response/user-role.response.dto';

export class UserRolesPaginationResponseDto {
  @Expose()
  meta!: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };

  @Expose()
  data!: UserRoleResponseDto[];
}
