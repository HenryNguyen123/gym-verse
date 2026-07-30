import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPayloadJWTLogin } from 'src/auth/interfaces/login.interface';
import { CreateProductRequest } from 'src/catalogs/dtos/request/create-product.request.dto';
import { Product } from 'src/catalogs/entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { pathFileName } from 'src/commons/utils/path-file-name.util';
import { generateSlug } from 'src/commons/utils/slug.util';
import { RoleEnum } from 'src/roles/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable({})
export class ProductService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
  // async test() {
  //   const check = () => {
  //     const name = 'nguyen van a';
  //     return name;
  //   };
  //   return check();
  // }
  //create
  async create(
    body: CreateProductRequest,
    jwtPay: IPayloadJWTLogin,
    path: string,
    file: Express.Multer.File | null,
  ) {
    const { sub } = jwtPay;
    const { categoryId, name } = body;
    const slug = generateSlug(name);
    const thumbnail = file ? pathFileName(file, path) : undefined;
    //check
    const checkAdmin = await this.userRepository.findOne({
      where: { id: sub },
      relations: {
        userRoles: {
          role: true,
        },
      },
    });
    if (!checkAdmin) throw new UnauthorizedException('User not found');
    const getRoles = checkAdmin.userRoles.map((ur) => ur.role.code as RoleEnum);
    const isAdmin = getRoles.some((role) =>
      [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN].includes(role),
    );

    if (!isAdmin) {
      throw new ForbiddenException('Permission denied');
    }
    const checkCate = await this.categoryRepository.exists({
      where: { id: categoryId },
    });
    if (!checkCate) throw new NotFoundException('Category not found');
    const checkProduct = await this.productRepository.findOne({
      where: [{ name }, { slug }],
    });
    if (checkProduct) throw new ConflictException('Product already exists');
    const productEntity = this.productRepository.create({
      ...body,
      slug,
      thumbnail,
      createdBy: checkAdmin.id,
    });
    const product = await this.productRepository.save(productEntity);
    return product;
  }
}
