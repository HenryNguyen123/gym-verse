import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePermissionRequestDto {
  @ApiProperty({ example: 'Create Category' })
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'CREATE_CATEGORY', required: true })
  @IsNotEmpty()
  @Transform(({ value }) => value.toUpperCase().trim())
  @IsString()
  @MinLength(2)
  code: string;

  @ApiProperty({ example: 'CATEGORY' })
  @IsNotEmpty()
  @Transform(({ value }) => value.toUpperCase().trim())
  @IsString()
  module: string;

  @ApiProperty({ example: 'Create category permission', required: false })
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsString()
  description?: string;

  // role codes
  @ApiProperty({
    example: ['SUPER_ADMIN', 'ADMIN'],
    required: true,
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  roleCodes: string[];
}
