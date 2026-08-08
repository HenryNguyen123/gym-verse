import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyDto {
  @ApiProperty({
    example: 'user1@gmail.com',
    required: true,
  })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email!: string;
}
