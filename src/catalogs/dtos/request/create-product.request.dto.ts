import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductRequest {
  @ApiProperty({
    example: 1,
    required: true,
    nullable: false,
  })
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  categoryId!: number;

  @ApiProperty({
    example: 'product-1',
    required: true,
    nullable: false,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  // @ApiProperty({
  //   example: 'slug-1',
  //   required: true,
  //   nullable: false,
  // })
  // @IsNotEmpty()
  // @IsString()
  // @MinLength(2)
  // @MaxLength(255)
  // slug!: string;

  @ApiProperty({
    example: 'sku-1',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  sku?: string;

  @ApiProperty({
    example: 'short_description',
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({
    example: 'description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    nullable: true,
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({
    example: 12000,
    nullable: false,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  price!: number;

  @ApiProperty({
    example: 12000,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Type(() => Number)
  @Min(0)
  salePrice?: number;

  @ApiProperty({
    default: 0,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @IsInt()
  stock?: number;

  @ApiProperty({
    default: true,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === '') return undefined;
    return value === 'true' || value === true;
  })
  isActive?: boolean;

  @ApiProperty({
    default: true,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === '') return undefined;
    return value === 'true' || value === true;
  })
  isFeatured?: boolean;

  @ApiProperty({
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  createdBy?: number;

  // @ApiProperty({
  //   nullable: true,
  // })
  // @IsOptional()
  // @Type(() => Number)
  // @IsInt()
  // updatedBy?: number;

  @ApiProperty({
    nullable: true,
  })
  @IsOptional()
  createdAt?: Date;

  @ApiProperty({
    nullable: true,
  })
  @IsOptional()
  updatedAt?: Date;
}
