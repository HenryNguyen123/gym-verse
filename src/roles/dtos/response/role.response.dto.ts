import { Expose } from 'class-transformer';

export class RoleResponseDto {
  @Expose()
  name?: string;

  @Expose()
  code?: string;

  @Expose()
  description?: string;

  @Expose()
  createdAt?: Date;
}
