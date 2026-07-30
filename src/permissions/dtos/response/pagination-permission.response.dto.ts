import { Expose } from 'class-transformer';
import { PermissionResponseDto } from 'src/permissions/dtos/response/permission-response.response.dto';

export class PaginationPermissionResponseDto {
  @Expose()
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };

  @Expose()
  data: PermissionResponseDto[];
}
