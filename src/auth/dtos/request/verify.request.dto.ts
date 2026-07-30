import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
}
