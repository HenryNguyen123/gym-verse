import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
// import { format } from 'path';
import { RoleCode } from 'src/auth/enums/role-code.enum';
import { IJwtPayload } from 'src/auth/interfaces/jwt.interface';
import { RoleCreateRequest } from 'src/roles/dtos/request/role-create.request.dto';
import { UpdateRoleRequest } from 'src/roles/dtos/request/role-update.request.dto';
import { RoleReadResponse } from 'src/roles/dtos/response/role-read.response.dto';
import { RoleResponseDto } from 'src/roles/dtos/response/role.response.dto';
import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { Like, Repository } from 'typeorm';
import { format } from 'date-fns';
import { RoleFindByIdReponse } from 'src/roles/dtos/response/role-find-by-id.resquest.dto';
import { RolesPaginationResponseDto } from 'src/roles/dtos/response/role-pagination.response.dto';
import { QueryRoleRequestDto } from 'src/roles/dtos/request/query-pagination.request.dto';
import { normalizeSearch } from 'src/commons/utils/to-lower-case.util';
import { getRedisPaginationKey } from 'src/commons/utils/get-redis-pagination-key.util';
import { ttlsRedis } from 'src/commons/utils/get-redis-key.util';
import { RedisService } from 'src/redis/redis.service';
import { measureTime, timeNow } from 'src/commons/utils/performance.util';
import { buildPaginationLoadingKey } from 'src/commons/utils/loading-key-pagination.util';

@Injectable()
export class RoleService {
  private rolePaginationLoading = new Map<
    string,
    Promise<RolesPaginationResponseDto>
  >();
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly redisService: RedisService,
  ) {}
  //pagination
  async getRolepagination(
    query: QueryRoleRequestDto,
  ): Promise<RolesPaginationResponseDto> {
    const start = timeNow();
    const ttls = ttlsRedis;

    const { search = '', page = 1, limit = 10 } = query;
    const normalizedSearch = normalizeSearch(search);

    const loadingKey = buildPaginationLoadingKey(normalizedSearch, page, limit);
    const key = process.env.REDIS_ROLE_PAGINATION ?? 'role:pagination';

    const queryList = {
      normalizedSearch,
      page: query.page,
      limit: query.limit,
    };
    // check redis
    for (const ttl of ttls) {
      const keyRedis = getRedisPaginationKey(queryList, key, ttl);
      const cachedUsers =
        await this.redisService.get<RolesPaginationResponseDto>(keyRedis);
      if (cachedUsers) {
        measureTime(
          `get users from redis:${key}:page:${page}:limit:${limit}:${ttl}ms`,
          start,
        );
        return cachedUsers;
      }
    }

    // return permission exists
    if (this.rolePaginationLoading.has(loadingKey)) {
      measureTime(`return users loading: ${loadingKey}`, start);
      return this.rolePaginationLoading.get(loadingKey)!;
    }

    // first load users in database
    const promise = this.paginationLoadingRole({
      ...query,
      page,
      limit,
      search: normalizedSearch,
    });
    this.rolePaginationLoading.set(loadingKey, promise);

    try {
      measureTime(`users loading`, start);
      return await promise;
    } finally {
      this.rolePaginationLoading.delete(loadingKey);
    }
  }
  //create role
  async create(jwt: IJwtPayload, body: RoleCreateRequest) {
    const roleCode = body.code.toUpperCase();
    const adminSub = jwt.sub;
    const valisRole = [RoleCode.ADMIN, RoleCode.SUPERADMIN];
    if (!adminSub) throw new UnauthorizedException('no authentication');
    const admin = await this.userRoleRepository.findOne({
      where: { userId: adminSub },
      relations: {
        role: true,
      },
    });
    if (!admin) throw new UnauthorizedException('User not found');
    if (!valisRole.includes(admin.role.code as RoleCode))
      throw new UnauthorizedException('User not role');
    // check role exists
    const roleCheck = await this.roleRepository.findOne({
      where: { code: roleCode },
    });
    if (roleCheck) throw new UnauthorizedException('Role exist');
    const roleEntity = this.roleRepository.create({
      name: body.name,
      code: roleCode,
      description: body.descsription,
      created_at: Date(),
    });
    await this.roleRepository.save(roleEntity);
  }
  //read roleas
  async read() {
    const res = await this.userRoleRepository.find({
      relations: {
        role: true,
        user: {
          profile: true,
        },
      },
    });
    const payload: RoleReadResponse[] = res.map((item) => ({
      roleId: item.roleId,
      roleName: item.role.name,
      roleCode: item.role.code,
      descRole: item.role.description,
      username: item.user.userName,
      email: item.user.email,
      isActive: item.user.isActive,
      fullName: item.user.profile?.fullName,
      gender: item.user.profile?.gender,
      avatar: item.user.profile?.avatar,
    }));
    return plainToInstance(RoleReadResponse, { payload });
  }
  // update role by admin
  async update(id: number, body: UpdateRoleRequest) {
    const { codeOld, name, code, description } = body;
    if (!codeOld) throw new UnauthorizedException('code old do not exist');
    const roleCheck = await this.roleRepository.findOne({
      where: { id },
      // where: { code: codeOld },
    });
    if (!roleCheck) throw new UnauthorizedException('User exist');
    const role = await this.roleRepository.update(roleCheck.id, {
      name: name ?? roleCheck.name,
      code: code ?? roleCheck.code,
      description: description ?? roleCheck.description,
    });
    if (!role.affected) throw new NotFoundException('role not found');
    const roleRes = await this.roleRepository.findOne({
      where: { code: code ?? codeOld },
    });
    if (!roleRes) throw new UnauthorizedException('role result don not exist');
    const payload: RoleResponseDto = {
      name: roleRes.name,
      code: roleRes.code,
      description: roleRes.description,
    };
    return plainToInstance(RoleResponseDto, { payload });
  }
  //delete role by admin as check code role
  async destroy(id: number) {
    const checkRole = await this.roleRepository.findOne({
      where: { id },
    });
    if (!checkRole) throw new NotFoundException('role not found');
    const res = await this.roleRepository.delete(checkRole.id);
    if (res.affected === 0) throw new NotFoundException('role not found');
  }
  // find role by id with admin role
  async findbyId(id: number) {
    const result = await this.roleRepository.findOne({
      where: { id: id },
      relations: {
        userRoles: {
          user: {
            profile: true,
          },
        },
      },
    });
    if (!result) throw new NotFoundException('role not found');
    const payload: RoleFindByIdReponse = {
      id: result.id,
      name: result.name,
      code: result.code,
      description: result.description,
      created_at: result.created_at
        ? format(result.created_at, 'yyyy-MM-dd HH:mm:ss')
        : '',
      userRoles: result?.userRoles.map((ur) => ({
        fullname: ur.user?.profile?.fullName ?? null,
        gender: ur.user?.profile?.gender ?? null,
        avatar: ur.user?.profile?.avatar ?? null,
      })),
    };
    return plainToInstance(RoleFindByIdReponse, { payload });
  }

  // pagination loading
  async paginationLoadingRole(
    query: QueryRoleRequestDto,
  ): Promise<RolesPaginationResponseDto> {
    const ttls = ttlsRedis;
    const { search, page = 1, limit = 10 } = query;
    const normalizedSearch = normalizeSearch(search);
    const redisKey = process.env.REDIS_ROLE_PAGINATION ?? 'role:pagination';

    const queryList = {
      normalizedSearch,
      page,
      limit,
    };

    const [roles, total] = await this.roleRepository.findAndCount({
      where: search
        ? [
            {
              code: Like(`%${normalizedSearch}%`),
            },
          ]
        : {},
      order: {
        created_at: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    const result: RolesPaginationResponseDto = {
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
      data: roles.map((r) => r),
    };
    await Promise.all(
      ttls.map((ttl) => {
        const key = getRedisPaginationKey(queryList, redisKey, ttl);
        return this.redisService.set(key, result, ttl * 60);
      }),
    );
    return result;
  }
  /////////////////////////////////
  // USER ROLE
  ////////////////////////////////
  //crate user-role by admin
  async userRoleCreate() {}
}
