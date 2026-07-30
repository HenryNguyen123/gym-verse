import { Expose, Type } from 'class-transformer';

class UserRoleReponse {
  @Expose()
  fullName?: string | null;

  @Expose()
  gender?: string | null;

  @Expose()
  avatar?: string | null;
}

export class RoleFindByIdReponse {
  @Expose()
  id?: number;

  @Expose()
  name?: string;

  @Expose()
  code?: string;

  @Expose()
  description?: string;

  @Expose()
  created_at?: string;

  @Expose()
  @Type(() => UserRoleReponse)
  userRoles?: UserRoleReponse[];
}
