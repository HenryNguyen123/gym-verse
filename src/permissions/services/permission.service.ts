import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { getRedisKey, ttlsRedis } from 'src/commons/utils/get-redis-key.util';
import { getRedisPaginationKey } from 'src/commons/utils/get-redis-pagination-key.util';
import { measureTime, timeNow } from 'src/commons/utils/performance.util';
import { CreatePermissionRequestDto } from 'src/permissions/dtos/request/create-permission.request.dto';
import { ListPermissionRequestDto } from 'src/permissions/dtos/request/list-permission.request.dto';
import { UpdatePermissionRequestDto } from 'src/permissions/dtos/request/update-permission.request.dto';
import { PaginationPermissionResponseDto } from 'src/permissions/dtos/response/pagination-permission.response.dto';
import { PermissionResponseDto } from 'src/permissions/dtos/response/permission-response.response.dto';
import { Permission } from 'src/permissions/entities/permission.entity';
import { RolePermission } from 'src/permissions/entities/role-permission.entity';
import { RedisService } from 'src/redis/redis.service';
import { Role } from 'src/roles/entities/role.entity';
import { In, Like, Repository } from 'typeorm';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly redisService: RedisService,
  ) {}
  // loading permission
  private permissionLoading?: Promise<PermissionResponseDto[]>;
  private permissionPaganitionLoading = new Map<
    string,
    Promise<PaginationPermissionResponseDto>
  >();
  // step: get all permission
  async read(
    query: ListPermissionRequestDto,
  ): Promise<PaginationPermissionResponseDto> {
    const start = timeNow();
    const ttls = ttlsRedis;
    const redisKey =
      process.env.REDIS_PERMISSION_PAGINATION ?? 'permission:pagination';
    const queryList = {
      search: query.search,
      page: query.page,
      limit: query.limit,
    };
    // Check Redis
    for (const ttl of ttls) {
      const key = getRedisPaginationKey(queryList, redisKey, ttl);

      const cached =
        await this.redisService.get<PaginationPermissionResponseDto>(key);

      if (cached) {
        measureTime(`get permission from redis:${key}:${ttl}ms`, start);
        return cached;
      }
    }
    // Query key dùng để chống duplicate DB query
    const { search = '', page = 1, limit = 10 } = query;

    const loadingKey = `${page}:${limit}:${search.toLowerCase()}`;
    // return permission exists
    if (this.permissionPaganitionLoading.has(loadingKey)) {
      measureTime(`return permission loading: ${loadingKey}`, start);
      return this.permissionPaganitionLoading.get(loadingKey)!;
    }
    // first load permission in database
    const promise = this.LoadPermissionPagination(query);
    this.permissionPaganitionLoading.set(loadingKey, promise);
    try {
      measureTime(`permission loading`, start);
      return await promise;
    } finally {
      this.permissionPaganitionLoading.delete(loadingKey);
    }
  }

  // step: find permission by id
  async findOne(id: number): Promise<PermissionResponseDto> {
    const start = timeNow();
    const permissionAll = await this.getAllPermission();
    measureTime(`permission check get all`, start);
    const permission = permissionAll.find((p) => p.id === id);
    measureTime(`permission exists`, start);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }

  // step: create permission
  async create(
    body: CreatePermissionRequestDto,
  ): Promise<PermissionResponseDto> {
    const start = timeNow();
    const { name, code, description, module, roleCodes } = body;
    // get permision in redis
    const permissionAll = await this.getAllPermission();
    measureTime(`permission check get all`, start);
    // check permission exists
    const permissionExists = permissionAll.find(
      (p) => p.code === code || p.name === name,
    );
    measureTime(`permission exists`, start);
    if (permissionExists) {
      throw new ConflictException('Permission already exists');
    }

    // check role exists
    const roleExists = await this.roleRepository.find({
      where: {
        code: In(roleCodes),
      },
    });
    measureTime(`check role exists`, start);
    if (roleExists.length !== roleCodes.length) {
      throw new NotFoundException('Role not found');
    }
    const permissionSave = this.permissionRepository.create({
      name,
      code: code.toUpperCase(),
      description,
      module: module.toUpperCase(),
    });
    const permission = await this.permissionRepository.save(permissionSave);
    // create role permission
    const rolePermissions = roleExists.map((role) => {
      return this.rolePermissionRepository.create({
        role,
        permission,
      });
    });
    await this.rolePermissionRepository.save(rolePermissions);
    measureTime(`permission successfuly`, start);
    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }

  //step: update permission by id
  async update(
    id: number,
    body: UpdatePermissionRequestDto,
  ): Promise<PermissionResponseDto> {
    const start = timeNow();
    const { name, code, description, module, roleCodes } = body;
    // check roles exists
    if (roleCodes.length === 0) {
      throw new BadRequestException('Role not found');
    }
    const roleExists = await this.roleRepository.find({
      where: {
        code: In(roleCodes),
      },
    });
    if (roleExists.length !== roleCodes.length) {
      throw new NotFoundException('Role not found');
    }
    // get permision in redis
    const permissionAll = await this.getAllPermission();
    measureTime(`permission check get all`, start);
    // check permission exists
    const permission = permissionAll.find((p) => p.id === id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    permission.name = name ? name : permission.name;
    permission.code = code ? code.toUpperCase() : permission.code;
    permission.description = description ? description : permission.description;
    permission.module = module ? module.toUpperCase() : permission.module;
    await this.permissionRepository.save(permission);
    measureTime(`permission check save`, start);
    // delete role permission
    await this.rolePermissionRepository.delete({
      permission,
    });
    measureTime(`permission check delete`, start);
    // update role permission
    const rolePermissions = roleExists.map((role) => {
      return this.rolePermissionRepository.create({
        role,
        permission,
      });
    });
    await this.rolePermissionRepository.save(rolePermissions);
    await this.getAllPermission();
    measureTime(`reset permission in redis`, start);
    measureTime(`permission check update successfuly`, start);
    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }

  // step: delete permission by id
  async destroy(id: number): Promise<PermissionResponseDto> {
    const start = timeNow();
    // get permision in redis
    const permissionAll = await this.getAllPermission();
    measureTime(`permission in redis`, start);
    const permission = permissionAll.find((p) => p.id === id);
    measureTime(`permission check exists`, start);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    // delete role permission
    await this.rolePermissionRepository.delete({
      permission,
    });
    // delete permission
    await this.permissionRepository.delete(id);
    measureTime(`permission delete successfuly`, start);
    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }
  // step: load permission from database
  private async LoadPermissionFromDb(): Promise<PermissionResponseDto[]> {
    const start = timeNow();
    const ttls = ttlsRedis;
    const key = process.env.REDIS_PERMISSION_ALL ?? 'permission:all';
    const result = await this.permissionRepository.find({
      relations: {
        rolePermissions: {
          role: true,
        },
      },
    });
    if (result.length === 0)
      throw new NotFoundException('Permission not found');
    measureTime(`get permission in db`, start);
    // save redis
    await Promise.all(
      ttls.map((ttl) => {
        const redisKey = getRedisKey(key, ttl);
        return this.redisService.set(redisKey, result, ttl * 60);
      }),
    );
    return result;
  }
  // step: load permission from database
  async getAllPermission(): Promise<PermissionResponseDto[]> {
    const start = timeNow();
    const ttls = ttlsRedis;
    const key = process.env.REDIS_PERMISSION_ALL ?? 'permission:all';
    // Check Redis
    for (const ttl of ttls) {
      const redisKey = getRedisKey(key, ttl);
      const cached =
        await this.redisService.get<PermissionResponseDto[]>(redisKey);

      if (cached) {
        measureTime(`get permission from redis:${key}:${ttl}ms`, start);
        return cached;
      }
    }
    //return permisson exists
    if (this.permissionLoading) {
      measureTime(`permission exists`, start);
      return this.permissionLoading;
    }

    this.permissionLoading = this.LoadPermissionFromDb();
    try {
      measureTime(`get permission from db`, start);
      return this.permissionLoading;
    } finally {
      this.permissionLoading = undefined;
    }
  }
  // step: load permission pagination from database
  private async LoadPermissionPagination(
    query: ListPermissionRequestDto,
  ): Promise<PaginationPermissionResponseDto> {
    const start = timeNow();
    const { search, page = 1, limit = 10 } = query;
    const ttls = ttlsRedis;
    const redisKey =
      process.env.REDIS_PERMISSION_PAGINATION ?? 'permission:pagination';
    const queryList = {
      search: query.search,
      page: query.page,
      limit: query.limit,
    };

    const [permissions, total] = await this.permissionRepository.findAndCount({
      where: search
        ? [
            { name: Like(`%${search}%`) },
            { code: Like(`%${search.toUpperCase()}%`) },
            { description: Like(`%${search}%`) },
            { module: Like(`%${search.toUpperCase()}%`) },
          ]
        : {},
      order: {
        name: 'ASC',
      },
      relations: {
        rolePermissions: {
          role: true,
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    measureTime(`get permission in db`, start);
    // save redis
    const result = {
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
      data: permissions,
    };
    await Promise.all(
      ttls.map((ttl) => {
        const key = getRedisPaginationKey(queryList, redisKey, ttl);
        return this.redisService.set(key, result, ttl * 60);
      }),
    );
    return result;
  }
}
