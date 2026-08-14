import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'crypto';
import { VerifyToken } from 'src/auth/entities/verify-token.entity';
import { MailJobName } from 'src/bullMQ-worker/processors/mails/mail.processor.bullMQWorker';
import { hashPassword } from 'src/commons/utils/password.util';
import { measureTime, timeNow } from 'src/commons/utils/performance.util';
import { RedisService } from 'src/redis/redis.service';
import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { RoleEnum } from 'src/roles/enums/role.enum';
import { CreateUserDto } from 'src/users/dtos/request/create-user.dto';
import { UpdateNewUserResDto } from 'src/users/dtos/request/update-new-user.request.dto';
import { UpdateStatusUserDto } from 'src/users/dtos/request/update-status.request.dto';
import { UserResponseDto } from 'src/users/dtos/response/user.response.dto';
import { Profile } from 'src/users/entities/profile.entity';
import { User } from 'src/users/entities/user.entity';
import { DataSource, Like, Repository } from 'typeorm';
import 'dotenv/config';
import { getRedisKey, ttlsRedis } from 'src/commons/utils/get-redis-key.util';
import { PaginationUsersResponseDto } from 'src/users/dtos/response/panigation-user.response.dto';
import { QueryUserRequestDto } from 'src/users/dtos/request/query-user.request.dto';
import { getRedisPaginationKey } from 'src/commons/utils/get-redis-pagination-key.util';

@Injectable()
export class UserService {
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
  // user loading pending
  private usersLoading?: Promise<UserResponseDto[]>;
  private userPaginationLoading = new Map<
    string,
    Promise<PaginationUsersResponseDto>
  >();

  // read all users pagination
  async getUsersPagination(
    query: QueryUserRequestDto,
  ): Promise<PaginationUsersResponseDto> {
    const start = timeNow();
    const ttls = ttlsRedis;
    const { search = '', page = 1, limit = 10 } = query;
    const loadingKey = `${page}:${limit}:${search.toLowerCase()}`;
    const key = process.env.REDIS_USER_PAGINATION ?? 'user:pagination';
    const queryList = {
      search: query.search,
      page: query.page,
      limit: query.limit,
    };
    // check redis
    for (const ttl of ttls) {
      const keyRedis = getRedisPaginationKey(queryList, key, ttl);
      const cachedUsers =
        await this.redisService.get<PaginationUsersResponseDto>(keyRedis);
      if (cachedUsers) {
        measureTime(
          `get users from redis:${key}:page:${page}:limit:${limit}:${ttl}ms`,
          start,
        );
        return cachedUsers;
      }
    }
    // return permission exists
    if (this.userPaginationLoading.has(loadingKey)) {
      measureTime(`return users loading: ${loadingKey}`, start);
      return this.userPaginationLoading.get(loadingKey)!;
    }
    // first load users in database
    const promise = this.loadPaginationUser(query);
    this.userPaginationLoading.set(loadingKey, promise);
    try {
      measureTime(`users loading`, start);
      return await promise;
    } finally {
      this.userPaginationLoading.delete(loadingKey);
    }
  }

  //create user
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const cacheKeys = process.env.REDIS_USER_ALL ?? 'users:all';
    const paginationKey =
      process.env.REDIS_USER_PAGINATION ?? 'user:pagination';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const start = timeNow();
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

    // get and check exists 
    const startCheckUser = timeNow();
    const existedUser = await this.userRepository.exists({
      where: [{ email }, { userName }],
    });
    measureTime('check user successfuly', startCheckUser);
    if (existedUser) {
      throw new ConflictException('Email or username already exists');
    }

    const starthash = timeNow();
    // Hash password
    const hashedPassword = await hashPassword(password);
    measureTime('check hash successfuly', starthash);

    ///////////// transaction ///////////////
    const startTran = timeNow();
    const res = await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const profileRepo = manager.getRepository(Profile);
      const roleRepo = manager.getRepository(Role);
      const userRoleRepo = manager.getRepository(UserRole);
      const verifyTokenRepo = manager.getRepository(VerifyToken);
      // Create user
      const user = userRepo.create({
        email,
        userName,
        password: hashedPassword,
      });
      await userRepo.save(user);

      // Create profile
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

      // Role
      const role = await roleRepo.findOneBy({
        code: RoleEnum.USER,
      });
      if (!role) {
        throw new InternalServerErrorException('Role USER not found');
      }
      const userRole = await userRoleRepo.save(
        userRoleRepo.create({
          user,
          role,
        }),
      );

      // Verify token
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
        userRole,
        role,
        token,
      };
    });
    measureTime('user transaction successfully', startTran);
    // Send mail
    const startMail = timeNow();
    try {
      await this.mailQueue.add(
        MailJobName.SEND_VERIFY_MAIL,
        {
          mail: res.user.email,
          fullName: res.profile.fullName,
          verifyLink: `${frontendUrl}/verify?token=${res.token}`,
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
    } catch (error: unknown) {
      console.log(error);
    }
    measureTime('send mail redis', startMail);

    const startRegetUser = timeNow();
    const result = {
      ...res.user,
      profile: res.profile,
      userRoles: [
        {
          role: res.role,
        },
      ],
    };

    if (!result) {
      throw new NotFoundException('User not found');
    }
    measureTime('reget user', startRegetUser);

    const startDelKey = timeNow();
    await Promise.all([
      //del redis exists
      this.redisService.deletePatternCached(cacheKeys),
      //delete old key pagination in redis
      this.redisService.deletePatternCached(paginationKey),
    ]);
    measureTime('delete old key redis', startDelKey);

    measureTime('successfuly', start);

    return plainToInstance(UserResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  //update
  async update(
    id: number,
    body: UpdateNewUserResDto,
  ): Promise<UserResponseDto> {
    const start = timeNow();
    const cacheKeys = process.env.REDIS_USER_ALL ?? 'users:all';
    const paginationKey =
      process.env.REDIS_USER_PAGINATION ?? 'user:pagination';
    const cacheUsers = await this.read();
    const user = cacheUsers.find((u) => u.id === id);
    measureTime('get user', start);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update Profile

    await this.profileRepository.update(user.profile.id, {
      fullName: body.fullName ?? user.profile.fullName,
      gender: body.gender ?? user.profile.gender,
      birthday: body.birthday ?? user.profile.birthday,
      phone: body.phone ?? user.profile.phone,

      avatar: body.avatarUrl ?? user.profile.avatar,
      avatarPublicId: body.avatarPublicId ?? user.profile.avatarPublicId,
      coverImage: body.coverImageUrl ?? user.profile.coverImage,
      coverImagePublicId:
        body.coverImagePublicId ?? user.profile.coverImagePublicId,

      bio: body.bio ?? user.profile.bio,
      height: body.height ?? user.profile.height,
      weight: body.weight ?? user.profile.weight,
      bodyFat: body.bodyFat ?? user.profile.bodyFat,
      goal: body.goal ?? user.profile.goal,
      fitnessLevel: body.fitnessLevel ?? user.profile.fitnessLevel,
      experienceYears: body.experienceYears ?? user.profile.experienceYears,
      city: body.city ?? user.profile.city,
      country: body.country ?? user.profile.country,
      privacySetting: body.privacySetting ?? user.profile.privacySetting,
    });
    measureTime('update profile', start);

    // Update Role

    if (body.roleCode) {
      const role = await this.roleRepository.findOneBy({
        code: body.roleCode,
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      const userRole = await this.userRoleRepository.findOne({
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

      await this.userRoleRepository.save(userRole);
    }
    measureTime('update role', start);

    // Reload
    const result = await this.userRepository.findOne({
      where: { id },
      relations: {
        profile: true,
        userRoles: {
          role: true,
        },
      },
    });

    if (!result) {
      throw new NotFoundException('User not found');
    }

    //del redis exists
    await this.redisService.deletePatternCached(cacheKeys);
    //delete old key pagination in redis
    await this.redisService.deletePatternCached(paginationKey);
    // await this.read();
    measureTime('delete old key cached successfuly', start);
    measureTime('update successfuly', start);

    return plainToInstance(UserResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  //read
  async read(): Promise<UserResponseDto[]> {
    const start = timeNow();
    const cacheKeys = [
      process.env.REDIS_USER_ALL_5M ?? 'users:all:5m',
      process.env.REDIS_USER_ALL_10M ?? 'users:all:10m',
      process.env.REDIS_USER_ALL_15M ?? 'users:all:15m',
    ];
    //check redis
    for (const key of cacheKeys) {
      const cacheUser = await this.redisService.get<UserResponseDto[]>(key);
      if (cacheUser) {
        measureTime(`get users from redis: ${key}`, start);
        return cacheUser;
      }
    }
    //return users exists
    if (this.usersLoading) {
      measureTime(`user exists`, start);
      return this.usersLoading;
    }

    this.usersLoading = this.LoadUsersFromDb();
    try {
      measureTime(`get users from db`, start);
      return await this.usersLoading;
    } finally {
      this.usersLoading = undefined;
    }
  }

  //find user by id
  async findById(id: number): Promise<UserResponseDto> {
    const start = timeNow();
    //get user by redis
    const cacheUsers = await this.read();
    const user = cacheUsers.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    measureTime('find user by id', start);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  //update status user
  async updateStatus(
    body: UpdateStatusUserDto,
    id: number,
  ): Promise<UserResponseDto> {
    const start = timeNow();
    const cacheKeys = process.env.REDIS_USER_ALL ?? 'users:all';
    const paginationKey =
      process.env.REDIS_USER_PAGINATION ?? 'user:pagination';
    //get user by redis
    const cacheUsers = await this.read();
    const user = cacheUsers.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.userRepository.update(id, {
      isActive: body.isActive,
    });

    if (!result.affected) {
      throw new InternalServerErrorException('Failed to update user status');
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
    //del and update of users into redis
    //del redis exists
    await this.redisService.deletePatternCached(cacheKeys);
    //delete old key pagination in redis
    await this.redisService.deletePatternCached(paginationKey);
    measureTime('update all users successfuly', start);
    measureTime('update status successfuly', start);

    return plainToInstance(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  //delete user
  async delete(id: number): Promise<void> {
    const start = timeNow();
    const cacheKeys = process.env.REDIS_USER_ALL ?? 'users:all';
    const paginationKey =
      process.env.REDIS_USER_PAGINATION ?? 'user:pagination';
    const resultRoleUser = await this.userRepository.delete(id);
    if (resultRoleUser.affected === 0)
      throw new NotFoundException('User not found');
    measureTime('update status successfuly', start);
    //del redis exists
    await this.redisService.deletePatternCached(cacheKeys);
    //delete old key pagination in redis
    await this.redisService.deletePatternCached(paginationKey);
    measureTime('del & update redis successfuly', start);
  }

  //load users from data
  private async LoadUsersFromDb(): Promise<UserResponseDto[]> {
    const start = timeNow();
    const ttls = ttlsRedis;
    const key = process.env.REDIS_USER_ALL ?? 'users:all';
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
        // 'user.status',
        // 'user.failedLoginAttempts',
        // 'user.lockedUntil',
        // 'user.lastLoginAt',
        // 'user.createdAt',
        // 'user.updatedAt',

        'profile.id',
        // 'profile.fullName',
        // 'profile.avatar',
        // 'profile.avatarPublicId',
        // 'profile.coverImage',
        // 'profile.coverImagePublicId',
        // 'profile.bio',
        // 'profile.gender',
        // 'profile.birthday',
        // 'profile.phone',
        // 'profile.height',
        // 'profile.weight',
        // 'profile.bodyFat',
        // 'profile.goal',
        // 'profile.fitnessLevel',
        // 'profile.experienceYears',
        // 'profile.city',
        // 'profile.country',
        // 'profile.privacySetting',

        'role.id',
        'role.name',
        'role.code',
      ])
      .getMany();
    const result = plainToInstance(UserResponseDto, users, {
      excludeExtraneousValues: true,
    });

    // save redis
    await Promise.all(
      ttls.map((ttl) => {
        const redisKey = getRedisKey(key, ttl);
        return this.redisService.set(redisKey, result, ttl * 60);
      }),
    );
    measureTime(`get permission in redis`, start);
    return result;
  }

  //load user pagination
  private async loadPaginationUser(
    query: QueryUserRequestDto,
  ): Promise<PaginationUsersResponseDto> {
    const start = timeNow();
    const ttls = ttlsRedis;
    const { search, page = 1, limit = 10 } = query;
    const normalizedSearch = search?.trim().toLowerCase() ?? '';
    const redisKey = process.env.REDIS_USER_PAGINATION ?? 'user:pagination';

    const queryList = {
      normalizedSearch,
      page,
      limit,
    };

    const [users, total] = await this.userRepository.findAndCount({
      where: search
        ? [
            {
              email: Like(`%${search}%`),
            },
            {
              userName: Like(`%${search}%`),
            },
            {
              profile: {
                fullName: Like(`%${search}%`),
              },
            },
          ]
        : {},
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

    measureTime('load users pagination', start);
    const result = {
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
      data: users,
    };
    await Promise.all(
      ttls.map((ttl) => {
        const key = getRedisPaginationKey(queryList, redisKey, ttl);
        return this.redisService.set(key, result, ttl * 60);
      }),
    );
    measureTime('set users in redis successfuly', start);
    return result;
  }

  // reidis set key in redis
  async loadUserKeyRedis(type: 'email' | 'username', value: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.userName', 'user.email'])
      .where(`user.${type === 'email' ? 'email' : 'userName'} = :value`, {
        value,
      })
      .getOne();

    if (!user) {
      return null;
    }
    const key = `user:${type}:${value}`;

    await this.redisService.set(key, user, 10 * 60);

    return user;
  }
}
