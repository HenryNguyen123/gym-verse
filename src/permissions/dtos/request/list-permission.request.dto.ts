import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ListPermissionRequestDto {
  @ApiProperty({
    example: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsString()
  search?: string;

  @ApiProperty({
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
}
