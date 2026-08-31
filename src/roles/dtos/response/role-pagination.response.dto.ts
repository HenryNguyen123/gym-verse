import { Expose } from 'class-transformer';
import { RoleResponseDto } from 'src/roles/dtos/response/role.response.dto';

export class RolesPaginationResponseDto {
  @Expose()
  meta!: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };

  @Expose()
  data!: RoleResponseDto[];
}
