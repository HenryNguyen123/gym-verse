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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleAdminGuard } from 'src/auth/guards/role-admin.guard';
import { UploadSomeFilesCloudinaryInterceptor } from 'src/commons/interceptors/upload-some-file-cloudinary.interceptor';
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateUserDto,
  })
  @UseInterceptors(
    UploadSomeFilesCloudinaryInterceptor([
      {
        name: 'avatar',
        maxCount: 1,
      },
      {
        name: 'coverImage',
        maxCount: 1,
      },
    ]),
  )
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    },
  ): Promise<UserResponseDto> {
    return await this.userService.create(createUserDto, files);
  }
  //update
  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  // @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @ApiBody({
    type: UpdateNewUserResDto,
  })
  @UseInterceptors(
    UploadSomeFilesCloudinaryInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateNewUserResDto,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    },
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto, files);
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
