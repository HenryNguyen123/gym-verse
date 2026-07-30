import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteUserDto {
  @ApiProperty({
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
