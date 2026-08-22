import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'crypto';
import { DataSource, ILike, Repository } from 'typeorm';
import { QueryFailedError } from 'typeorm';

import { VerifyToken } from 'src/auth/entities/verify-token.entity';
import { MailJobName } from 'src/bullMQ-worker/processors/mails/mail.processor.bullMQWorker';
import { hashPassword } from 'src/commons/utils/password.util';
import { measureTime, timeNow } from 'src/commons/utils/performance.util';
import { getRedisKey, ttlsRedis } from 'src/commons/utils/get-redis-key.util';
import { getRedisPaginationKey } from 'src/commons/utils/get-redis-pagination-key.util';

import { RedisService } from 'src/redis/redis.service';

import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { RoleEnum } from 'src/roles/enums/role.enum';

import { CreateUserDto } from 'src/users/dtos/request/create-user.dto';
import { QueryUserRequestDto } from 'src/users/dtos/request/query-user.request.dto';
import { UpdateNewUserDto } from 'src/users/dtos/request/update-new-user.request.dto';
import { UpdateStatusUserDto } from 'src/users/dtos/request/update-status.request.dto';

import { PaginationUsersResponseDto } from 'src/users/dtos/response/panigation-user.response.dto';
import { UserResponseDto } from 'src/users/dtos/response/user.response.dto';

import { Profile } from 'src/users/entities/profile.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  private usersLoading?: Promise<UserResponseDto[]>;

  private readonly userPaginationLoading = new Map<
    string,
    Promise<PaginationUsersResponseDto>
  >();

  constructor(
    @InjectQueue('mail')
    private readonly mailQueue: Queue,

    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    @InjectRepository(VerifyToken)
    private readonly verifyTokenRepository: Repository<VerifyToken>,

    private readonly configService: ConfigService,
  ) {}

  /**
   * =========================================================
   * GET USERS PAGINATION
   * =========================================================
   */
  async getUsersPagination(
    query: QueryUserRequestDto,
  ): Promise<PaginationUsersResponseDto> {
    const start = timeNow();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const normalizedSearch = this.normalizeSearch(query.search);

    const loadingKey = this.buildPaginationLoadingKey(
      normalizedSearch,
      page,
      limit,
    );

    const redisKey = process.env.REDIS_USER_PAGINATION ?? 'user:pagination';

    const paginationQuery = {
      normalizedSearch,
      page,
      limit,
    };

    /**
     * Check Redis
     */
    for (const ttl of ttlsRedis) {
      const key = getRedisPaginationKey(paginationQuery, redisKey, ttl);

      const cached =
        await this.redisService.get<PaginationUsersResponseDto>(key);

      if (cached) {
        measureTime('get users pagination from redis', start);
        return cached;
      }
    }

    /**
     * Prevent cache stampede
     */
    const existingLoading = this.userPaginationLoading.get(loadingKey);

    if (existingLoading) {
      return existingLoading;
    }

    const promise = this.loadPaginationUser({
      ...query,
      page,
      limit,
      search: normalizedSearch,
    });

    this.userPaginationLoading.set(loadingKey, promise);

    try {
      return await promise;
    } finally {
      this.userPaginationLoading.delete(loadingKey);
    }
  }

  /**
   * =========================================================
   * CREATE USER
   * =========================================================
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const start = timeNow();

    const cacheKeys = process.env.REDIS_USER_ALL ?? 'users:all';

    const paginationKey =
      process.env.REDIS_USER_PAGINATION ?? 'user:pagination';

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    if (!frontendUrl) {
      throw new InternalServerErrorException('FRONTEND_URL is not configured');
    }

    const {
      email,
      password,
      userName,
      fullName,
      gender,
      birthday,
      phone,
      bio,
      height,
      weight,
      avatarUrl,
      avatarPublicId,
      coverImageUrl,
      coverImagePublicId,
      bodyFat,
      goal,
      fitnessLevel,
      experienceYears,
      city,
      country,
      privacySetting,
    } = createUserDto;

    /**
     * Fast duplicate check
     * NOTE:
     * DB UNIQUE constraint is still required.
     */
    const existedUser = await this.userRepository.exists({
      where: [{ email }, { userName }],
    });

    if (existedUser) {
      throw new ConflictException('Email or username already exists');
    }

    const hashedPassword = await hashPassword(password);

    /**
     * Get default role before transaction.
     * This reduces transaction time.
     */
    const role = await this.roleRepository.findOneBy({
      code: RoleEnum.USER,
    });

    if (!role) {
      throw new InternalServerErrorException('Default USER role not found');
    }

    let transactionResult: {
      user: User;
      profile: Profile;
      role: Role;
      token: string;
    };

    try {
      transactionResult = await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const profileRepo = manager.getRepository(Profile);
        const userRoleRepo = manager.getRepository(UserRole);
        const verifyTokenRepo = manager.getRepository(VerifyToken);

        const user = userRepo.create({
          email,
          userName,
          password: hashedPassword,
        });

        await userRepo.save(user);

        const profile = profileRepo.create({
          user,
          fullName,
          gender,
          birthday,
          phone,
          avatar: avatarUrl,
          avatarPublicId,
          coverImage: coverImageUrl,
          coverImagePublicId,
          bio,
          height,
          weight,
          bodyFat,
          goal,
          fitnessLevel,
          experienceYears,
          city,
          country,
          privacySetting,
        });

        await profileRepo.save(profile);

        await userRoleRepo.save(
          userRoleRepo.create({
            user,
            role,
          }),
        );

        const token = randomUUID();

        await verifyTokenRepo.save(
          verifyTokenRepo.create({
            userId: user.id,
            token,
            expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }),
        );

        return {
          user,
          profile,
          role,
          token,
        };
      });
    } catch (error) {
      if (this.isPostgresUniqueViolation(error)) {
        throw new ConflictException('Email or username already exists');
      }

      throw error;
    }

    /**
     * Queue verification email
     *
     * Do not make Redis/cache/API fail if queue broker
     * is temporarily unavailable.
     */
    try {
      await this.mailQueue.add(
        MailJobName.SEND_VERIFY_MAIL,
        {
          mail: transactionResult.user.email,
          fullName: transactionResult.profile.fullName,
          verifyLink: `${frontendUrl}/verify?token=${transactionResult.token}`,
          expireTime: '24h',
        },
        {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue verification email for user ${transactionResult.user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    /**
     * Invalidate cache
     */
    await this.invalidateUserCaches(cacheKeys, paginationKey);

    measureTime('create user successful', start);

    return this.toUserResponse({
      ...transactionResult.user,
      profile: transactionResult.profile,
      userRoles: [
        // {
        //   role: transactionResult.role,
        // },
      ],
    });
  }

  /**
   * =========================================================
   * UPDATE USER
   * =========================================================
   */
  async update(id: number, body: UpdateNewUserDto): Promise<UserResponseDto> {
    const start = timeNow();

    const cacheKeys = process.env.REDIS_USER_ALL ?? 'users:all';

    const paginationKey =
      process.env.REDIS_USER_PAGINATION ?? 'user:pagination';

    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        profile: true,
        userRoles: {
          role: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profile) {
      throw new InternalServerErrorException('User profile not found');
    }

    await this.dataSource.transaction(async (manager) => {
      const profileRepo = manager.getRepository(Profile);
      const roleRepo = manager.getRepository(Role);
      const userRoleRepo = manager.getRepository(UserRole);

      await profileRepo.update(user.profile.id, {
        fullName:
          body.fullName !== undefined ? body.fullName : user.profile.fullName,

        gender: body.gender !== undefined ? body.gender : user.profile.gender,

        birthday:
          body.birthday !== undefined ? body.birthday : user.profile.birthday,

        phone: body.phone !== undefined ? body.phone : user.profile.phone,

        avatar:
          body.avatarUrl !== undefined ? body.avatarUrl : user.profile.avatar,

        avatarPublicId:
          body.avatarPublicId !== undefined
            ? body.avatarPublicId
            : user.profile.avatarPublicId,

        coverImage:
          body.coverImageUrl !== undefined
            ? body.coverImageUrl
            : user.profile.coverImage,

        coverImagePublicId:
          body.coverImagePublicId !== undefined
            ? body.coverImagePublicId
            : user.profile.coverImagePublicId,

        bio: body.bio !== undefined ? body.bio : user.profile.bio,

        height: body.height !== undefined ? body.height : user.profile.height,

        weight: body.weight !== undefined ? body.weight : user.profile.weight,

        bodyFat:
          body.bodyFat !== undefined ? body.bodyFat : user.profile.bodyFat,

        goal: body.goal !== undefined ? body.goal : user.profile.goal,

        fitnessLevel:
          body.fitnessLevel !== undefined
            ? body.fitnessLevel
            : user.profile.fitnessLevel,

        experienceYears:
          body.experienceYears !== undefined
            ? body.experienceYears
            : user.profile.experienceYears,

        city: body.city !== undefined ? body.city : user.profile.city,

        country:
          body.country !== undefined ? body.country : user.profile.country,

        privacySetting:
          body.privacySetting !== undefined
            ? body.privacySetting
            : user.profile.privacySetting,
      });

      /**
       * Current design assumes ONE primary role.
       *
       * If you really support multiple roles,
       * this logic should be redesigned.
       */
      if (body.roleCode !== undefined) {
        const role = await roleRepo.findOneBy({
          // code: body.roleCode,
        });

        if (!role) {
          throw new NotFoundException('Role not found');
        }

        const userRole = await userRoleRepo.findOne({
          where: {
            user: {
              id: user.id,
            },
          },
          relations: {
            role: true,
          },
        });

        if (!userRole) {
          throw new NotFoundException('User role not found');
        }

        userRole.role = role;

        await userRoleRepo.save(userRole);
      }
    });

    /**
     * Re-fetch fresh entity
     */
    const updatedUser = await this.userRepository.findOne({
      where: { id },
      relations: {
        profile: true,
        userRoles: {
          role: true,
        },
      },
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    await this.invalidateUserCaches(cacheKeys, paginationKey);

    measureTime('update user successful', start);

    return this.toUserResponse(updatedUser);
  }

  /**
   * =========================================================
   * GET ALL USERS
   * =========================================================
   */
  async read(): Promise<UserResponseDto[]> {
    const start = timeNow();

    const redisKey = process.env.REDIS_USER_ALL ?? 'users:all';

    /**
     * Check cache
     */
    for (const ttl of ttlsRedis) {
      const key = getRedisKey(redisKey, ttl);

      const cached = await this.redisService.get<UserResponseDto[]>(key);

      if (cached) {
        measureTime('get all users from redis', start);
        return cached;
      }
    }

    /**
     * Prevent cache stampede
     */
    if (this.usersLoading) {
      return this.usersLoading;
    }

    this.usersLoading = this.loadUsersFromDb();

    try {
      return await this.usersLoading;
    } finally {
      this.usersLoading = undefined;
    }
  }

  /**
   * =========================================================
   * FIND USER BY ID
   * =========================================================
   */
  async findById(id: number): Promise<UserResponseDto> {
    const start = timeNow();

    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        profile: true,
        userRoles: {
          role: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    measureTime('find user by id', start);

    return this.toUserResponse(user);
  }

  /**
   * =========================================================
   * UPDATE STATUS
   * =========================================================
   */
  async updateStatus(
    body: UpdateStatusUserDto,
    id: number,
  ): Promise<UserResponseDto> {
    const start = timeNow();

    const cacheKeys = process.env.REDIS_USER_ALL ?? 'users:all';

    const paginationKey =
      process.env.REDIS_USER_PAGINATION ?? 'user:pagination';

    const updateResult = await this.userRepository.update(id, {
      isActive: body.isActive,
    });

    if (!updateResult.affected) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.userRepository.findOne({
      where: { id },
      relations: {
        profile: true,
        userRoles: {
          role: true,
        },
      },
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    await this.invalidateUserCaches(cacheKeys, paginationKey);

    measureTime('update status successful', start);

    return this.toUserResponse(updatedUser);
  }

  /**
   * =========================================================
   * DELETE USER
   * =========================================================
   */
  async delete(id: number): Promise<void> {
    const start = timeNow();

    const cacheKeys = process.env.REDIS_USER_ALL ?? 'users:all';

    const paginationKey =
      process.env.REDIS_USER_PAGINATION ?? 'user:pagination';

    const result = await this.userRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('User not found');
    }

    /**
     * DB is source of truth.
     * Redis failure should not turn successful deletion
     * into HTTP 500.
     */
    try {
      await this.invalidateUserCaches(cacheKeys, paginationKey);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache after deleting user ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    measureTime('delete user successful', start);
  }

  /**
   * =========================================================
   * LOAD ALL USERS FROM DB
   * =========================================================
   */
  private async loadUsersFromDb(): Promise<UserResponseDto[]> {
    const start = timeNow();

    const redisKey = process.env.REDIS_USER_ALL ?? 'users:all';

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .select([
        'user.id',
        'user.userName',
        'user.email',
        'user.isActive',
        'user.isVerified',

        'profile.id',
        'profile.fullName',
        'profile.avatar',

        'role.id',
        'role.name',
        'role.code',
      ])
      .getMany();

    const result = users.map((user) => this.toUserResponse(user));

    await Promise.all(
      ttlsRedis.map((ttl) => {
        const key = getRedisKey(redisKey, ttl);

        return this.redisService.set(key, result, ttl * 60);
      }),
    );

    measureTime('load users from db', start);

    return result;
  }

  /**
   * =========================================================
   * LOAD PAGINATION
   * =========================================================
   */
  private async loadPaginationUser(
    query: QueryUserRequestDto,
  ): Promise<PaginationUsersResponseDto> {
    const start = timeNow();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const normalizedSearch = this.normalizeSearch(query.search);

    const redisKey = process.env.REDIS_USER_PAGINATION ?? 'user:pagination';

    const [users, total] = await this.userRepository.findAndCount({
      where: normalizedSearch
        ? [
            {
              email: ILike(`%${normalizedSearch}%`),
            },
            {
              userName: ILike(`%${normalizedSearch}%`),
            },
            {
              profile: {
                fullName: ILike(`%${normalizedSearch}%`),
              },
            },
          ]
        : undefined,

      order: {
        createdAt: 'DESC',
      },

      relations: {
        profile: true,
        userRoles: {
          role: true,
        },
      },

      skip: (page - 1) * limit,
      take: limit,
    });

    const result: PaginationUsersResponseDto = {
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },

      data: users.map((user) => this.toUserResponse(user)),
    };

    const paginationQuery = {
      normalizedSearch,
      page,
      limit,
    };

    await Promise.all(
      ttlsRedis.map((ttl) => {
        const key = getRedisPaginationKey(paginationQuery, redisKey, ttl);

        return this.redisService.set(key, result, ttl * 60);
      }),
    );

    measureTime('load users pagination', start);

    return result;
  }

  /**
   * =========================================================
   * LOAD USER REDIS KEY
   * =========================================================
   */
  async loadUserKeyRedis(
    type: 'email' | 'username',
    value: string,
  ): Promise<Pick<User, 'id' | 'userName' | 'email'> | null> {
    const normalizedValue = value.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where:
        type === 'email'
          ? { email: normalizedValue }
          : { userName: normalizedValue },

      select: {
        id: true,
        userName: true,
        email: true,
      },
    });

    if (!user) {
      return null;
    }

    const key = `user:${type}:${normalizedValue}`;

    await this.redisService.set(key, user, 10 * 60);

    return user;
  }

  /**
   * =========================================================
   * HELPERS
   * =========================================================
   */

  private normalizeSearch(search?: string): string {
    return search?.trim().toLowerCase() ?? '';
  }

  private buildPaginationLoadingKey(
    search: string,
    page: number,
    limit: number,
  ): string {
    return `${search}:${page}:${limit}`;
  }

  private async invalidateUserCaches(
    cacheKeys: string,
    paginationKey: string,
  ): Promise<void> {
    await Promise.all([
      this.redisService.deletePatternCached(cacheKeys),

      this.redisService.deletePatternCached(paginationKey),
    ]);
  }

  private toUserResponse(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  private isPostgresUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string;
    };

    return driverError?.code === '23505';
  }
}
