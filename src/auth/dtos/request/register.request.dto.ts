import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { GenderEnum } from 'src/users/enums/profile.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'test@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'john_doe',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @IsNotEmpty()
  userName!: string;

  @ApiProperty({
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  @IsNotEmpty()
  password!: string;

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
    enum: GenderEnum,
    required: false,
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
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  avatar?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  coverImage?: Express.Multer.File;
}
