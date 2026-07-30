import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateStatusUserDto {
  @ApiProperty({
    example: 'true',
    required: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}
