import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleAdminGuard } from 'src/auth/guards/role-admin.guard';
import { CreateUserDto } from 'src/users/dtos/request/create-user.dto';
import { QueryUserRequestDto } from 'src/users/dtos/request/query-user.request.dto';
import { UpdateNewUserDto } from 'src/users/dtos/request/update-new-user.request.dto';
import { UpdateStatusUserDto } from 'src/users/dtos/request/update-status.request.dto';
import { PaginationUsersResponseDto } from 'src/users/dtos/response/panigation-user.response.dto';
import { UserResponseDto } from 'src/users/dtos/response/user.response.dto';
import { UserService } from 'src/users/services/user.service';

@ApiTags('admin/users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RoleAdminGuard)
export class UserAdminController {
  constructor(private readonly userService: UserService) {}

  //create
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    type: CreateUserDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: UserResponseDto,
    description: 'create user successfully',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

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

  //read
  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginationUsersResponseDto,
    description: 'get all users successfully',
  })
  async read(
    @Query() query: QueryUserRequestDto,
  ): Promise<PaginationUsersResponseDto> {
    return this.userService.getUsersPagination(query);
  }

  //find user by id
  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserResponseDto,
    description: 'find user successfully',
  })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.userService.findById(id);
  }

  //update status user
  @Patch(':id/status')
  @ApiBody({
    type: UpdateStatusUserDto,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserResponseDto,
    description: 'update status user successfully',
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStatusUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateStatus(body, id);
  }

  //delete user
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'delete user successfully',
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.userService.delete(id);
  }
}
