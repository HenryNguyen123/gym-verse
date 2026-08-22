import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RoleEnum } from 'src/roles/enums/role.enum';
import {
  FitnessGoalEnum,
  FitnessLevelEnum,
  GenderEnum,
  PrivacySettingEnum,
} from 'src/users/enums/profile.enum';

export class UpdateNewUserDto {
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
    example: GenderEnum.MALE,
    required: false,
    enum: GenderEnum,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : (value as GenderEnum)))
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiProperty({
    example: '1995-08-04',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return new Date(value as string);
  })
  @IsDate()
  birthday?: Date;

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
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  avatarUrl?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  avatarPublicId?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  coverImageUrl?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  coverImagePublicId?: string;

  @ApiProperty({
    example: 'Fitness enthusiast',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  bio?: string;

  @ApiProperty({
    example: 175,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  height?: number;

  @ApiProperty({
    example: 72,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @ApiProperty({
    example: 15.5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  bodyFat?: number;

  @ApiProperty({
    example: FitnessGoalEnum.BUILD_MUSCLE,
    enum: FitnessGoalEnum,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' ? undefined : (value as FitnessGoalEnum),
  )
  @IsEnum(FitnessGoalEnum)
  goal?: FitnessGoalEnum;

  @ApiProperty({
    example: FitnessLevelEnum.BEGINNER,
    enum: FitnessLevelEnum,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' ? undefined : (value as FitnessLevelEnum),
  )
  @IsEnum(FitnessLevelEnum)
  fitnessLevel?: FitnessLevelEnum;

  @ApiProperty({
    example: 2,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @ApiProperty({
    example: 'Ho Chi Minh City',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    example: 'Vietnam',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    example: PrivacySettingEnum.PUBLIC,
    enum: PrivacySettingEnum,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' ? undefined : (value as PrivacySettingEnum),
  )
  @IsEnum(PrivacySettingEnum)
  privacySetting?: PrivacySettingEnum;

  @ApiProperty({
    example: [RoleEnum.USER],
    enum: RoleEnum,
    required: false,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.filter((item): item is RoleEnum => item !== '');
    }

    return [value as RoleEnum];
  })
  @IsEnum(RoleEnum, { each: true })
  roleCode?: RoleEnum[];
}
