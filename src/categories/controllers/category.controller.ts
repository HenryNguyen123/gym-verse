import {
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Req,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from 'src/permissions/decorators/permission.decorator';
import { PermissionEnum } from 'src/permissions/enums/permission-enums.enum';
import { PermissionsGuard } from 'src/permissions/guards/permissions.guard';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { RoleEnum } from 'src/roles/enums/role.enum';
import { RolesGuard } from 'src/roles/guards/roles.guard';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CategoryCreateRequest } from 'src/categories/dtos/request/category-create.request.dto';
import { CategoryService } from 'src/categories/services/category.service';
import { UploadFileInterceptor } from 'src/commons/interceptors/upload-file.interceptor';
import { RoleAdminGuard } from 'src/auth/guards/role-admin.guard';
import { IJwtPayload } from 'src/auth/interfaces/jwt.interface';
import { CategoryReadReponse } from 'src/categories/dtos/response/categories-read.response';
import { CategoryUpdateReq } from 'src/categories/dtos/request/category-update.request.dto';
import { CateDeleteRequestDto } from 'src/categories/dtos/request/categody-destroy.request.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  //test
  @Get('test')
  @Roles(RoleEnum.USER, RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  @Permissions(PermissionEnum.TEST_CATEGORY)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  test() {
    return 'test';
  }
  //create category
  @Post()
  @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @ApiBody({
    type: CategoryCreateRequest,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(UploadFileInterceptor('image', './public/images/category'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Body() body: CategoryCreateRequest,
    @UploadedFile() file: Express.Multer.File | null,
  ) {
    const path: string = '/images/category';
    const user = req['user'] as IJwtPayload;
    await this.categoryService.create(body, file, path, user);
  }
  //read category
  @Get()
  async read(): Promise<CategoryReadReponse> {
    return await this.categoryService.read();
  }
  //update category
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @ApiBody({
    type: CategoryUpdateReq,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(UploadFileInterceptor('image', './public/images/category'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CategoryUpdateReq,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File | null,
  ) {
    const path: string = '/images/category';
    const user = req['user'] as IJwtPayload;
    return await this.categoryService.update(id, body, user, file, path);
  }
  //delete category
  @Delete()
  @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @HttpCode(204)
  @ApiBody({
    type: CateDeleteRequestDto,
  })
  async destroy(@Body() body: CateDeleteRequestDto) {
    await this.categoryService.destroy(body);
  }
  //find category by id
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return await this.categoryService.findById(id);
  }
}
