import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CateDeleteRequestDto {
  @ApiProperty({
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  id?: number;
}
