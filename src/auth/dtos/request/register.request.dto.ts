import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'test@gmail.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'john_doe',
    required: true,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    example: 'password',
    required: true,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName?: string;

  @ApiProperty({
    example: 'male',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  gender?: string;

  @ApiProperty({
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return new Date(value);
  })
  // @Type(() => Date)
  @IsDate()
  dob?: string;

  @ApiProperty({
    example: '0123456789',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  avatar?: any;
}
