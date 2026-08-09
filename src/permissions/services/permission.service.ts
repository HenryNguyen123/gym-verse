import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
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
  private permissionLoading?: Promise<PaginationPermissionResponseDto>;
  private permissionPaganitionLoading = new Map<
    string,
    Promise<PaginationPermissionResponseDto>
  >();
  // step: get all permission
  async read(
    query: ListPermissionRequestDto,
  ): Promise<PaginationPermissionResponseDto> {
    const start = timeNow();
    const ttls = [5, 10, 15];

    // Check Redis
    for (const ttl of ttls) {
      const key = this.getPermissionPaginationKey(query, ttl);

      const cached =
        await this.redisService.get<PaginationPermissionResponseDto>(key);

      if (cached) {
        measureTime(`get permission from redis: ${key}`, start);
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
    const permission = await this.permissionRepository.findOne({
      where: {
        id,
      },
      relations: {
        rolePermissions: {
          role: true,
        },
      },
    });
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
    const { name, code, description, module, roleCodes } = body;
    // check permission exists
    const permissionExists = await this.permissionRepository.findOne({
      where: {
        code,
      },
    });
    if (permissionExists) {
      throw new ConflictException('Permission already exists');
    }

    // check role exists
    const roleExists = await this.roleRepository.find({
      where: {
        code: In(roleCodes),
      },
    });
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
    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }

  //step: update permission by id
  async update(
    id: number,
    body: UpdatePermissionRequestDto,
  ): Promise<PermissionResponseDto> {
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
    // check permission exists
    const permission = await this.permissionRepository.findOne({
      where: {
        id,
      },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    permission.name = name ? name : permission.name;
    permission.code = code ? code.toUpperCase() : permission.code;
    permission.description = description ? description : permission.description;
    permission.module = module ? module.toUpperCase() : permission.module;
    await this.permissionRepository.save(permission);
    // delete role permission
    await this.rolePermissionRepository.delete({
      permission,
    });
    // update role permission
    const rolePermissions = roleExists.map((role) => {
      return this.rolePermissionRepository.create({
        role,
        permission,
      });
    });
    await this.rolePermissionRepository.save(rolePermissions);
    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }

  // step: delete permission by id
  async destroy(id: number): Promise<PermissionResponseDto> {
    const permission = await this.permissionRepository.findOne({
      where: {
        id,
      },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    // delete role permission
    await this.rolePermissionRepository.delete({
      permission,
    });
    // delete permission
    await this.permissionRepository.delete(id);
    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }
  // step: load permission from database
  private async LoadPermissionFromDb(): Promise<PermissionResponseDto[]> {
    const start = timeNow();
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
    await Promise.all([
      this.redisService.set(
        process.env.REDIS_PERMISSION_ALL_5M ?? 'permission:all:5m',
        result,
        5 * 60,
      ),
      this.redisService.set(
        process.env.REDIS_PERMISSION_ALL_10M ?? 'permission:all:10m',
        result,
        10 * 60,
      ),
      this.redisService.set(
        process.env.REDIS_PERMISSION_ALL_15M ?? 'permission:all:15m',
        result,
        15 * 60,
      ),
    ]);
    return result;
  }
  // step: get key load permission pagination from database
  private getPermissionPaginationKey(
    query: ListPermissionRequestDto,
    ttl: number,
  ): string {
    const { search = '', page = 1, limit = 10 } = query;

    const prefix =
      process.env.REDIS_PERMISSION_PAGINATION ?? 'permission:pagination';

    return `${prefix}:${page}:${limit}:${search.toLowerCase()}:${ttl}m`;
  }
  // step: load permission pagination from database
  private async LoadPermissionPagination(
    query: ListPermissionRequestDto,
  ): Promise<PaginationPermissionResponseDto> {
    const start = timeNow();
    const { search, page = 1, limit = 10 } = query;
    const ttls = [5, 10, 15];
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
        const key = this.getPermissionPaginationKey(query, ttl);
        return this.redisService.set(key, result, ttl * 60);
      }),
    );
    return result;
  }
}
