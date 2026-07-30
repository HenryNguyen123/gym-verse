import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleAdminGuard } from 'src/auth/guards/role-admin.guard';
import { IPayloadJWTLogin } from 'src/auth/interfaces/login.interface';
import { CreateProductRequest } from 'src/catalogs/dtos/request/create-product.request.dto';
import { ProductService } from 'src/catalogs/services/product.service';
import { UploadFileInterceptor } from 'src/commons/interceptors/upload-file.interceptor';
// import { measureTime, timeNow } from 'src/commons/utils/performance.util';

@ApiTags('product')
@ApiBearerAuth()
@Controller('product')
export class ProductController {
  constructor(private productService: ProductService) {}
  // @Get('test')
  // async test() {
  //   const start = timeNow();
  //   const res = await this.productService.test();
  //   measureTime('msql', start);
  //   return res;
  // }
  //create
  @Post()
  @UseGuards(JwtAuthGuard, RoleAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    type: CreateProductRequest,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(UploadFileInterceptor('image', './public/images/products'))
  async create(
    @Body() body: CreateProductRequest,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File | null,
  ) {
    const path: string = '/images/products';
    const jwtUser = req['user'] as IPayloadJWTLogin;
    return await this.productService.create(body, jwtUser, path, file);
  }
  //read
  @Get()
  async read() {}
  //update
  @Patch(':id')
  async update() {}
  //delete
  @Delete(':id')
  async remove() {}
}
