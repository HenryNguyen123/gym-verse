import { Expose } from 'class-transformer';

export class RoleReadResponse {
  @Expose()
  roleId?: number;

  @Expose()
  roleName?: string;

  @Expose()
  roleCode?: string;

  @Expose()
  descRole?: string;

  @Expose()
  username?: string;

  @Expose()
  email?: string;

  @Expose()
  isActive?: boolean;

  @Expose()
  fullName?: string;

  @Expose()
  gender?: string;

  @Expose()
  avatar?: string;
}
