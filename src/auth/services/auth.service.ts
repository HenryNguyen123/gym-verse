import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from '../dtos/request/login.request.dto';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { comparePassword, hashPassword } from 'src/commons/utils/password.util';
import { JwtService } from '@nestjs/jwt';
import {
  IPayloadJWTLogin,
  IPayloadLogin,
} from 'src/auth/interfaces/login.interface';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { plainToInstance } from 'class-transformer';
import { LoginResponseDto } from 'src/auth/dtos/response/login.response.dto';
import ms, { StringValue } from 'ms';
import { RedisService } from 'src/redis/redis.service';
import { RegisterDto } from 'src/auth/dtos/request/register.request.dto';
import { Profile } from 'src/users/entities/profile.entity';
import { Role } from 'src/roles/entities/role.entity';
import { RoleEnum } from 'src/roles/enums/role.enum';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { VerifyToken } from 'src/auth/entities/verify-token.entity';
import { VerifyDto } from 'src/auth/dtos/request/verify.request.dto';
import { ResetPasswordToken } from 'src/auth/entities/reset-password-token.entity';
import { measureTime, timeNow } from 'src/commons/utils/performance.util';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MailJobName } from 'src/bullMQ-worker/processors/mails/mail.processor.bullMQWorker';
import { UserService } from 'src/users/services/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectQueue('mail')
    private readonly mailQueue: Queue,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(VerifyToken)
    private readonly verifyTokenRepository: Repository<VerifyToken>,
    @InjectRepository(ResetPasswordToken)
    private readonly resetPasswordTokenRepository: Repository<ResetPasswordToken>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {}
  // step: login
  async login(loginDto: LoginDto, ip: string) {
    const start = timeNow();
    // data login
    const { email, password } = loginDto;
    const keyAccess = this.configService.get<string>(
      'JWT_ACCESS_TOKEN_SECRET_KEY',
    );
    const keyRefresh = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_SECRET_KEY',
    );
    const timeAccess = this.configService.get<string>(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    );
    const timeRefresh = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    );
    const timeRefreshMs = ms(timeRefresh as StringValue);
    // check validate
    if (!timeAccess || !timeRefresh || !keyAccess || !keyRefresh) {
      throw new InternalServerErrorException('Missing JWT configuration');
    }

    // check user exist
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePermission')
      .leftJoinAndSelect('rolePermission.permission', 'permission')
      .where('user.email = :email', { email })
      .andWhere('user.is_active = true')
      .getOne();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    measureTime('get user', start);
    // check redis
    const redisId = `user:${ip}:${user.email}`;
    const countRedis = Number((await this.redisService.get(redisId)) || 0);
    if (countRedis >= 5) {
      throw new UnauthorizedException('User is locked for 5 minutes');
    }
    // check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      // set redis
      await this.redisService.incr(redisId, 300);
      throw new UnauthorizedException('Invalid password');
    }
    // reset redis
    await this.redisService.del(redisId);
    // payload
    const roles = user.userRoles.map((userRole) => {
      return {
        name: userRole.role.name,
        code: userRole.role.code,
      };
    });
    const roleCode = user.userRoles.map((userRole) => {
      return userRole.role.code;
    });
    // const permissionCodes = user.userRoles.map((userRole) => {
    //   return userRole.role.rolePermissions.map((rolePermission) => {
    //     return rolePermission.permission.code;
    //   });
    // });
    // const permissionCodes = user.userRoles.flatMap((userRole) =>
    //   userRole.role.rolePermissions.map((rp) => rp.permission.code),
    // );
    const payload: IPayloadLogin = {
      email: user.email,
      userName: user.userName,
      isActive: user.isActive,
      role: roles,
      profile: {
        fullName: user.profile.fullName,
        gender: user.profile.gender,
        birthday: user.profile.birthday,
        phone: user.profile.phone,
        avatar: user.profile.avatar,
      },
    };
    const payloadJWT: IPayloadJWTLogin = {
      sub: user.id,
      roleCode: roleCode,
      // permissionCodes: permissionCodes,
    };
    // generate token
    const accessToken = await this.jwtService.signAsync(payloadJWT, {
      secret: keyAccess,
      expiresIn: timeAccess as StringValue,
    });
    const refreshToken = await this.jwtService.signAsync(payloadJWT, {
      secret: keyRefresh,
      expiresIn: timeRefresh as StringValue,
    });
    measureTime('create jwt service successfuly', start);
    // save refresh token
    await this.refreshTokenRepository.delete({
      userId: user.id,
    }); // delete all refresh token of user
    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + timeRefreshMs),
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);
    measureTime('login successfuly', start);
    // response
    return plainToInstance(LoginResponseDto, {
      status: 200,
      accessToken,
      refreshToken,
      user: payload,
    });
  }

  // step: logout2
  async logout(user: IPayloadJWTLogin, ip: string) {
    if (!user.sub) {
      throw new UnauthorizedException('User not found');
    }
    const userExist = await this.userRepository.findOneBy({
      id: user.sub,
    });
    if (!userExist) {
      throw new UnauthorizedException('User not found');
    }
    // check refresh token
    const refreshToken = await this.refreshTokenRepository.findOneBy({
      userId: user.sub,
    });
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    // delete refresh token
    await this.refreshTokenRepository.delete({
      userId: user.sub,
    });
    // delete redis
    await this.redisService.del(`user:${ip}:${userExist.email}`);
  }

  // step: register
  async register(registerDto: RegisterDto) {
    const start = timeNow();
    const cacheKeys = [
      process.env.REDIS_USER_ALL_5M ?? 'users:all:5m',
      process.env.REDIS_USER_ALL_10M ?? 'users:all:10m',
      process.env.REDIS_USER_ALL_15M ?? 'users:all:15m',
    ];
    const {
      email,
      password,
      userName,
      fullName,
      gender,
      birthday,
      phone,
      avatarUrl,
      avatarPublicId,
      coverImageUrl,
      coverImagePublicId,
    } = registerDto;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    // const RoleUserCode = RoleCodeEnum.USER;
    // get and check all users into redis
    const cacheUsers = await this.userService.read();
    measureTime('get user into redis', start);
    // check user exist
    const user = cacheUsers.find(
      (u) => u.email === email || u.userName === userName,
    );
    measureTime('get user', start);
    if (user) {
      throw new ConflictException('Email or username already exists');
    }
    // hash password
    const hash = await hashPassword(password);
    // create user
    const userEntity = this.userRepository.create({
      email,
      password: hash,
      userName,
    });
    await this.userRepository.save(userEntity);
    // create profile
    const profileEntity = this.profileRepository.create({
      user: userEntity,
      fullName,
      gender,
      birthday,
      phone,
      avatar: avatarUrl,
      avatarPublicId,
      coverImage: coverImageUrl,
      coverImagePublicId,
    });
    await this.profileRepository.save(profileEntity);
    measureTime('create profile', start);
    // get Role
    const role = await this.roleRepository.findOneBy({
      code: RoleEnum.USER,
    });
    if (!role) {
      throw new InternalServerErrorException('Role not found');
    }
    // create user role
    const userRoleEntity = this.userRoleRepository.create({
      user: userEntity,
      role,
    });
    await this.userRoleRepository.save(userRoleEntity);
    measureTime('create role', start);
    // send verify mail
    const uuid = randomUUID();
    // check verify token
    const checkVerifyToken = await this.verifyTokenRepository.findOneBy({
      userId: userEntity.id,
    });
    if (checkVerifyToken) {
      await this.verifyTokenRepository.delete({
        userId: userEntity.id,
      });
    }
    // create verify token
    const verifyTokenEntity = this.verifyTokenRepository.create({
      userId: userEntity.id,
      token: uuid,
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await this.verifyTokenRepository.save(verifyTokenEntity);
    measureTime('create verify token', start);

    //send mail with redis
    await this.mailQueue.add(
      MailJobName.SEND_VERIFY_MAIL,
      {
        mail: email,
        fullName: profileEntity.fullName,
        verifyLink: `${frontendUrl}/verify?token=${uuid}`,
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
    //delete redis key and reset redis
    for (const key of cacheKeys) {
      await this.redisService.del(key);
    }
    await this.userService.read();
    measureTime('reset users redis successfuly', start);

    measureTime('register successfuly', start);
    return {
      stastus: 'successfuly',
    };
  }

  // step: send mail verify
  async sendMailVerify(email: string) {
    const start = timeNow();
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const uuid = randomUUID();
    // get all users into redis
    const cacheUsers = await this.userService.read();
    measureTime('get users into redis successfuly', start);
    const user = cacheUsers.find((u) => u.email === email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    measureTime('check user successfuly', start);
    // check redis
    const keyRedis = `verify-${email}-${user.id}`;
    const getRedis = Number((await this.redisService.get(keyRedis)) || 0);
    if (getRedis === 0) {
      await this.redisService.incr(keyRedis, 15 * 60);
    }
    if (getRedis >= 3) {
      throw new BadRequestException('Please try again later');
    }
    // check verify token
    const verifyToken = await this.verifyTokenRepository.findOneBy({
      userId: user.id,
    });
    if (verifyToken) {
      await this.verifyTokenRepository.delete({
        userId: user.id,
      });
    }
    measureTime('check redis successfuly', start);
    // create verify token
    const verifyTokenEntity = this.verifyTokenRepository.create({
      userId: user.id,
      token: uuid,
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await this.verifyTokenRepository.save(verifyTokenEntity);
    measureTime('verify token successfuly', start);
    // await this.mailService.sendVerifyMail(
    //   email,
    //   user.profile.fullName,
    //   `${frontendUrl}/verify?token=${uuid}`,
    //   '24h',
    // );
    await this.mailQueue.add(
      MailJobName.SEND_VERIFY_MAIL,
      {
        mail: email,
        fullName: user.profile.fullName,
        verifyLink: `${frontendUrl}/verify?token=${uuid}`,
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
    measureTime('sendmail successfuly', start);
  }

  // step: forgot password
  async forgotPassword(body: VerifyDto) {
    const start = timeNow();
    const email = body.email;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const uuid = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(uuid).digest('hex');
    // step: check redis
    const keyRedis = `forgot-password-${email}`;
    const getRedis = Number((await this.redisService.get(keyRedis)) || 0);
    if (getRedis === 0) {
      await this.redisService.incr(keyRedis, 15 * 60);
    } else {
      await this.redisService.incr(keyRedis);
    }
    if (getRedis >= 3) {
      throw new BadRequestException('Please try again later');
    }
    measureTime('check redis successfuly', start);
    // step: get users into redis
    const cacheUsers = await this.userService.read();
    // step: check user exist
    const user = cacheUsers.find((u) => u.email === email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    measureTime('check user successfuly', start);
    // step: exisit verify email
    if (!user.isVerified) {
      throw new UnauthorizedException('User not verified');
    }
    // step: check reset password token
    const resetPasswordToken =
      await this.resetPasswordTokenRepository.findOneBy({
        userId: user.id,
      });
    if (resetPasswordToken) {
      await this.resetPasswordTokenRepository.delete({
        userId: user.id,
      });
    }
    // step: create reset password token
    const resetPasswordTokenEntity = this.resetPasswordTokenRepository.create({
      userId: user.id,
      token: hashedToken,
      isUsed: false,
      expiredAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    await this.resetPasswordTokenRepository.save(resetPasswordTokenEntity);
    measureTime('reset password token successfuly', start);

    await this.mailQueue.add(
      MailJobName.SEND_FORGET_PASSWORD,
      {
        mail: email,
        fullName: user.profile.fullName,
        verifyLink: `${frontendUrl}/verify?token=${uuid}`,
        expireTime: '15 minutes',
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
    measureTime('sendmail successfuly', start);
  }

  // step: reset password
  // async resetPassword(body: string) {}
}
