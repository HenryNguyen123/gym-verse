import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ttlsRedis } from 'src/commons/utils/get-redis-key.util';
import { getRedisPaginationKey } from 'src/commons/utils/get-redis-pagination-key.util';
import { normalizeSearch } from 'src/commons/utils/to-lower-case.util';
import { RedisService } from 'src/redis/redis.service';
import { QueryUserRoleRequestDto } from 'src/roles/dtos/request/query-user-role-pagination.request.dto';
import { UserRolesPaginationResponseDto } from 'src/roles/dtos/response/user-role-pagination.dto';
import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { Like, Repository } from 'typeorm';

@Injectable()
export class UserRoleService {
  private userRolePaginationLoading = new Map<
    string,
    Promise<UserRolesPaginationResponseDto>
  >();
  constructor(
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly redisService: RedisService,
  ) {}
  //get pagiantion read
  async getPaginationUserRole(
    query: QueryUserRoleRequestDto,
  ): Promise<UserRolesPaginationResponseDto> {}
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
