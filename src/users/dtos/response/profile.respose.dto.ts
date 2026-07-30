import { Expose } from 'class-transformer';

export class ProfileResponseDto {
  @Expose()
  fullName: string;

  @Expose()
  gender?: string;

  @Expose()
  dob?: Date;

  @Expose()
  phone?: string;

  @Expose()
  avatar?: string;
}
