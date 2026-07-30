import { IsNotEmpty, IsString } from 'class-validator';

export class ResetpasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  newPassword: string;

  oldPassword: string;
}
