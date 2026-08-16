import {
  Body,
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateNewUserDto } from 'src/users/dtos/request/update-new-user.request.dto';
import { UserResponseDto } from 'src/users/dtos/response/user.response.dto';
import { UserService } from 'src/users/services/user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  //update
  @Patch(':id')
  @ApiBody({
    type: UpdateNewUserDto,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserResponseDto,
    description: 'update user successfully',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateNewUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }
}
