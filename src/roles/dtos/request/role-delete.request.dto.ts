import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RoleDeleteRequestDto {
  @ApiProperty({
    example: 'user',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  code?: string;
}
