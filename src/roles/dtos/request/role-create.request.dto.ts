import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RoleCreateRequest {
  @ApiProperty({
    example: 'user',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    example: 'USER',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({
    example: 'this is user',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  descsription?: string;
}
