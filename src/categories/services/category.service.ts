import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryCreateRequest } from 'src/categories/dtos/request/category-create.request.dto';
import { Category } from 'src/categories/entities/category.entity';
import { Repository } from 'typeorm';
import { pathFileName } from 'src/commons/utils/path-file-name.util';
import { IJwtPayload } from 'src/auth/interfaces/jwt.interface';
import { User } from 'src/users/entities/user.entity';
import { CategoryReadReponse } from 'src/categories/dtos/response/categories-read.response';
import { plainToInstance } from 'class-transformer';
import { CategoryUpdateReq } from 'src/categories/dtos/request/category-update.request.dto';
import { RoleCode } from 'src/auth/enums/role-code.enum';
import { CateDeleteRequestDto } from 'src/categories/dtos/request/categody-destroy.request.dto';
import { generateSlug } from 'src/commons/utils/slug.util';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly cateRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  //create category
  async create(
    body: CategoryCreateRequest,
    file: Express.Multer.File | null,
    path: string,
    user: IJwtPayload,
  ) {
    const { name, description, isActive } = body;
    let { parentId } = body;
    const slug = generateSlug(name);
    //check parent id
    if (parentId === 0) {
      parentId = undefined;
    }
    if (parentId) {
      const cateExist = await this.cateRepository.findOne({
        where: { id: parentId },
      });
      if (!cateExist)
        throw new UnauthorizedException('category of parent id not exist!');
      parentId = cateExist.id;
    }
    //check admin exist
    const admin = await this.userRepository.findOne({
      where: { email: user.email },
    });
    if (!admin) throw new InternalServerErrorException('admin not exist!');
    const cateCheck = await this.cateRepository.findOne({
      where: [{ name }, { slug }],
    });
    if (cateCheck)
      throw new ConflictException('name of slug category already exists');
    let pathCate: string | null = null;
    if (file) {
      pathCate = pathFileName(file, path);
    }
    const cateEntity = this.cateRepository.create({
      name,
      slug,
      description,
      image: pathCate != null ? pathCate : undefined,
      parentId: parentId ?? undefined,
      isActive,
      createdBy: admin.id,
      createdAt: Date(),
    });
    const cate = await this.cateRepository.save(cateEntity);
    console.log('cate is: ', cate);
  }
  //read category
  async read() {
    const cateLog = await this.cateRepository.find({});
    const payload: CategoryReadReponse[] = cateLog.map((item) => ({
      name: item.name,
      slug: item.slug,
      description: item.description ?? undefined,
      image: item.image ?? undefined,
      isActive: item.isActive,
      parentId: item.parentId,
      createdAt: item.createdAt ?? undefined,
    }));
    return plainToInstance(CategoryReadReponse, { payload });
  }
  //update category
  async update(
    id: number,
    body: CategoryUpdateReq,
    user: IJwtPayload,
    file: Express.Multer.File | null,
    path: string,
  ) {
    let { parentId } = body;
    const { name, description, isActive } = body;
    const { sub, email } = user;
    const slug = generateSlug(name);
    let pathCate: string | null = null;
    if (file) {
      pathCate = pathFileName(file, path);
    }
    const valisRole = [RoleCode.ADMIN, RoleCode.SUPERADMIN];
    const admin = await this.userRepository.findOne({
      where: { email, id: sub },
      relations: {
        userRoles: { role: true },
      },
    });
    if (!admin) throw new InternalServerErrorException('user not exist!');
    const roleCheck = admin.userRoles.some((ur) =>
      valisRole.includes(ur.role.code as RoleCode),
    );
    if (!roleCheck) throw new InternalServerErrorException('role not exist!');
    //check exist
    const cate = await this.cateRepository.findOne({
      where: { id },
    });
    if (!cate) throw new InternalServerErrorException('category not exist!');
    //check not exist new parend Id and old parent id
    // check parent id exist??????
    if (parentId !== 0) {
      const prarentIdExist = await this.cateRepository.findOne({
        where: { id: parentId },
      });
      if (!prarentIdExist)
        throw new InternalServerErrorException('category" parent not exist!');
    }
    if (!cate.parentId && parentId == 0) {
      parentId = 1;
    } else if (cate.parentId && parentId == 0) {
      parentId = cate.parentId;
    }
    console.log('parent id cate is: ', cate.parentId);
    console.log('parent id request is: ', parentId);
    const cateUpdate = await this.cateRepository.update(cate.id, {
      name: name ?? cate.name,
      slug: name ? slug : cate.slug,
      description: description ?? cate.description,
      image: pathCate ?? cate.image,
      parentId: parentId ?? cate.parentId,
      isActive: isActive ?? cate.isActive,
      updatedBy: admin.id,
      updatedAt: Date(),
    });
    return cateUpdate;
  }
  //delete category
  async destroy(body: CateDeleteRequestDto) {
    const cateCheck = await this.cateRepository.findOne({
      where: { id: body.id },
    });
    if (!cateCheck) throw new NotFoundException('Category not found');
    const checkCount = await this.cateRepository.count({
      where: { parentId: cateCheck.id },
    });
    if (checkCount > 0)
      throw new BadRequestException(
        'Category has child categories, cannot delete',
      );
    const res = await this.cateRepository.delete(cateCheck.id);
    if (res.affected === 0) throw new NotFoundException('category not found');
  }
  async findById(id: number) {
    const result = [] as Category[];
    let current = await this.cateRepository.findOne({
      where: { id },
    });
    if (!current) {
      throw new NotFoundException('Category not found');
    }
    while (current) {
      result.unshift(current);
      if (!current.parentId) {
        break;
      }
      current = await this.cateRepository.findOne({
        where: { id: current.parentId },
      });
    }
    return result;
  }
}
