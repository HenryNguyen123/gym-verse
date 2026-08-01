import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  FitnessGoalEnum,
  FitnessLevelEnum,
  GenderEnum,
  PrivacySettingEnum,
} from 'src/users/enums/profile.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'test@gmail.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'john_doe',
    required: true,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @IsNotEmpty()
  userName!: string;

  @ApiProperty({
    example: 'password',
    required: true,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    example: 'John Doe',
    required: false,
    maxLength: 100,
  })
  @IsNotEmpty()
  @Transform(({ value }) => (value === '' ? undefined : (value as string)))
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({
    example: 'male',
    default: GenderEnum.MALE,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : (value as GenderEnum)))
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiProperty({
    example: '1990-01-01',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return new Date(value as string);
  })
  // @Type(() => Date)
  @IsDate()
  birthday?: Date;

  @ApiProperty({
    example: '0123456789',
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
  })
  @IsOptional()
  avatar?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  coverImage?: Express.Multer.File;

  @ApiProperty({
    example: 'bio text text text text',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  bio?: string;

  @ApiProperty({
    example: 123,
  })
  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Type(() => Number)
  @Min(0)
  height?: number;

  @ApiProperty({
    example: 123,
  })
  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Type(() => Number)
  @Min(0)
  weight?: number;

  @ApiProperty({
    example: 123,
  })
  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Type(() => Number)
  @Min(0)
  bodyFat?: number;

  @ApiProperty({
    example: 'build_muscle',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' ? undefined : (value as FitnessGoalEnum),
  )
  @IsEnum(FitnessGoalEnum)
  goal?: FitnessGoalEnum;

  @ApiProperty({
    example: 'beginner',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' ? undefined : (value as FitnessLevelEnum),
  )
  @IsEnum(FitnessLevelEnum)
  fitnessLevel?: FitnessLevelEnum;

  @ApiProperty({
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @ApiProperty({
    example: 'tp hcm',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  city?: string;

  @ApiProperty({
    example: 'VietNamese',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    example: 'public',
  })
  @IsNotEmpty()
  @Transform(({ value }) =>
    value === '' ? undefined : (value as PrivacySettingEnum),
  )
  @IsEnum(PrivacySettingEnum)
  privacySetting!: PrivacySettingEnum;
}
