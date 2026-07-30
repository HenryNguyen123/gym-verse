import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
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
}
