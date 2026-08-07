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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleAdminGuard } from 'src/auth/guards/role-admin.guard';
import { CreateUserDto } from 'src/users/dtos/request/create-user.dto';
import { UpdateNewUserResDto } from 'src/users/dtos/request/update-new-user.request.dto';
import { UpdateStatusUserDto } from 'src/users/dtos/request/update-status.request.dto';
import { UserResponseDto } from 'src/users/dtos/response/user.response.dto';
import { UserService } from 'src/users/services/user.service';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  //create
  @Post()
  // @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  // @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateUserDto,
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return await this.userService.create(createUserDto);
  }
  //update
  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @ApiBody({
    type: UpdateNewUserResDto,
  })
  // @UseInterceptors(
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateNewUserResDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }
  //read
  @Get()
  // @UseGuards(JwtAuthGuard, RoleAdminGuard)
  async read(): Promise<UserResponseDto[]> {
    return await this.userService.read();
  }
  //find user by id
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return await this.userService.findById(id);
  }
  //update status user
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @ApiBody({
    type: UpdateStatusUserDto,
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStatusUserDto,
  ): Promise<UserResponseDto> {
    return await this.userService.updateStatus(body, id);
  }
  //delete user
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @HttpCode(204)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.userService.delete(id);
  }
}
