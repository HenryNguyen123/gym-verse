import { Expose } from 'class-transformer';

export class ReadUserResponseDto {
  //user
  @Expose()
  userId: number | undefined;

  @Expose()
  userName: string | undefined;

  @Expose()
  email: string | undefined;

  @Expose()
  isActive: boolean | undefined;

  @Expose()
  createaAt: Date | undefined;

  //profile
  @Expose()
  profileId: number | undefined;

  @Expose()
  fullName: string | undefined;

  @Expose()
  phone: number | undefined;

  @Expose()
  avatar: string | undefined;

  //role
  @Expose()
  roleId: number | undefined;

  @Expose()
  nameRole: string | undefined;

  @Expose()
  codeRole: string | undefined;
}
