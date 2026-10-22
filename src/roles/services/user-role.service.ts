import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ttlsRedis } from 'src/commons/utils/get-redis-key.util';
import { getRedisPaginationKey } from 'src/commons/utils/get-redis-pagination-key.util';
import { buildPaginationLoadingKey } from 'src/commons/utils/loading-key-pagination.util';
import { measureTime, timeNow } from 'src/commons/utils/performance.util';
import { normalizeSearch } from 'src/commons/utils/to-lower-case.util';
import { RedisService } from 'src/redis/redis.service';
import { QueryUserRoleRequestDto } from 'src/roles/dtos/request/query-user-role-pagination.request.dto';
import { UserRolesPaginationResponseDto } from 'src/roles/dtos/response/user-role-pagination.dto';
import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserRoleService {
  private userRolePaginationLoading = new Map<
    string,
    Promise<UserRolesPaginationResponseDto>
  >();
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly redisService: RedisService,
  ) {}
  //get pagiantion read
  async getPaginationUserRole(
    query: QueryUserRoleRequestDto,
  ): Promise<UserRolesPaginationResponseDto> {
    const start = timeNow();
    const ttls = ttlsRedis;

    const { search = '', page = 1, limit = 10 } = query;
    const normalizedSearch = normalizeSearch(search);

    const loadingKey = buildPaginationLoadingKey(normalizedSearch, page, limit);
    const key =
      process.env.REDIS_USER_ROLE_PAGINATION ?? 'user-role:pagination';

    const queryList = {
      normalizedSearch,
      page: query.page,
      limit: query.limit,
    };
    // check redis
    for (const ttl of ttls) {
      const keyRedis = getRedisPaginationKey(queryList, key, ttl);
      const cachedUsers =
        await this.redisService.get<UserRolesPaginationResponseDto>(keyRedis);
      if (cachedUsers) {
        measureTime(
          `get users from redis:${key}:page:${page}:limit:${limit}:${ttl}ms`,
          start,
        );
        return cachedUsers;
      }
    }

    // return permission exists
    if (this.userRolePaginationLoading.has(loadingKey)) {
      measureTime(`return users loading: ${loadingKey}`, start);
      return this.userRolePaginationLoading.get(loadingKey)!;
    }

    // first load users in database
    const promise = this.paginationLoadingUserRole({
      ...query,
      page,
      limit,
      search: normalizedSearch,
    });
    this.userRolePaginationLoading.set(loadingKey, promise);

    try {
      measureTime(`users loading`, start);
      return await promise;
    } finally {
      this.userRolePaginationLoading.delete(loadingKey);
    }
  }
  // pagination loading
  async paginationLoadingUserRole(
    query: QueryUserRoleRequestDto,
  ): Promise<UserRolesPaginationResponseDto> {
    const ttls = ttlsRedis;
    const { search, page = 1, limit = 10 } = query;
    const userId = query.userId;
    const normalizedSearch = normalizeSearch(search);
    const redisKey =
      process.env.REDIS_USER_ROLE_PAGINATION ?? 'user-role:pagination';

    const queryList = {
      normalizedSearch,
      page,
      limit,
    };

    const [roles, total] = await this.userRoleRepository.findAndCount({
      where: search
        ? [
            {
              userId: userId,
            },
          ]
        : {},
      order: {
        created_at: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    const result: UserRolesPaginationResponseDto = {
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
}
