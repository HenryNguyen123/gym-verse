import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@gmail.com' })
  @IsEmail()
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  email: string;

  @ApiProperty({ example: '123456' })
  @MinLength(6)
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  password: string;
}
