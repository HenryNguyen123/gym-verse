import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateNewUserResDto {
  @ApiProperty({
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : (value as string)))
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName?: string;

  @ApiProperty({
    example: 'male',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : (value as string)))
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
    return new Date(value as string);
  })
  @IsDate()
  dob?: string;

  @ApiProperty({
    example: '0123456789',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : (value as string)))
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

  // role
  @ApiProperty({
    example: 'USER',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : (value as string)))
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  roleCode?: string;
}
