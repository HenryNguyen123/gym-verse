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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleAdminGuard } from 'src/auth/guards/role-admin.guard';
import { UploadFileInterceptor } from 'src/commons/interceptors/upload-file.interceptor';
import { CreateUserDto } from 'src/users/dtos/request/create-user.dto';
import { DeleteUserDto } from 'src/users/dtos/request/delete-user.request.dto';
import { UpdateNewUserResDto } from 'src/users/dtos/request/update-new-user.request.dto';
import { UpdateStatusUserDto } from 'src/users/dtos/request/update-status.request.dto';
import { ReadUserResponseDto } from 'src/users/dtos/response/read-user.response.dto';
import { UserResponseDto } from 'src/users/dtos/response/user.response.dto';
import { UserService } from 'src/users/services/user.service';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  //create
  @Post()
  @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateUserDto,
  })
  @UseInterceptors(UploadFileInterceptor('avatar', './public/images/avatar'))
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File | null,
  ): Promise<void> {
    const path: string = '/images/avatar';
    await this.userService.create(createUserDto, file, path);
  }
  //update
  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateNewUserResDto,
  })
  @UseInterceptors(UploadFileInterceptor('avatar', './public/images/avatar'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateNewUserResDto,
    @UploadedFile() file: Express.Multer.File | null,
  ): Promise<UserResponseDto> {
    const path: string = '/images/avatar';
    return this.userService.update(id, updateUserDto, file, path);
  }
  //read
  @Get()
  async read(): Promise<ReadUserResponseDto> {
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
  @Delete()
  @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @HttpCode(204)
  @ApiBody({
    type: DeleteUserDto,
  })
  async delete(@Body() body: DeleteUserDto) {
    await this.userService.delete(body);
  }
}
