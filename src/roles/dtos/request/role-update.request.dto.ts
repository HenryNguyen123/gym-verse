import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRoleRequest {
  @ApiProperty({
    example: 'USER_OLD',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  codeOld?: string;

  @ApiProperty({
    example: 'user',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    example: 'USER',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @ApiProperty({
    example: 'this is user',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
