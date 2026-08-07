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
import { MailJobName } from 'src/bullMQ-worker/processors/mails/users/user-mail.processor.bullMQWorker';
import { CloudinaryService } from 'src/cloudinary/services/cloudinary.service';
import { hashPassword } from 'src/commons/utils/password.util';
import { measureTime, timeNow } from 'src/commons/utils/performance.util';
import { MailService } from 'src/mails/services/mail.service';
import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { RoleEnum } from 'src/roles/enums/role.enum';
import { CreateUserDto } from 'src/users/dtos/request/create-user.dto';
import { UpdateNewUserResDto } from 'src/users/dtos/request/update-new-user.request.dto';
import { UpdateStatusUserDto } from 'src/users/dtos/request/update-status.request.dto';
import { UserResponseDto } from 'src/users/dtos/response/user.response.dto';
import { Profile } from 'src/users/entities/profile.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectQueue('mail')
    private readonly mailQueue: Queue,
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
    private readonly mailService: MailService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  //create user
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
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

    // Check email & username
    const existedUser = await this.userRepository.findOne({
      where: [{ email }, { userName }],
    });

    if (existedUser) {
      throw new ConflictException('Email or username already exists');
    }

    // Upload files
    // const [avatarUpload, coverImageUpload] = await Promise.all([
    //   files.avatar?.length
    //     ? await this.cloudinaryService.uploadFileCloudinary(files.avatar[0])
    //     : Promise.resolve(null),
    //   files.coverImage?.length
    //     ? await this.cloudinaryService.uploadFileCloudinary(files.coverImage[0])
    //     : Promise.resolve(null),
    // ]);
    // measureTime('upload image in cloudinary', start);

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = this.userRepository.create({
      email,
      userName,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    // Create profile
    const profile = this.profileRepository.create({
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
    await this.profileRepository.save(profile);
    measureTime('create profile', start);

    // Role
    const role = await this.roleRepository.findOneBy({
      code: RoleEnum.USER,
    });
    if (!role) {
      throw new InternalServerErrorException('Role USER not found');
    }
    await this.userRoleRepository.save(
      this.userRoleRepository.create({
        user,
        role,
      }),
    );
    measureTime('create role', start);

    // Verify token
    const token = randomUUID();
    await this.verifyTokenRepository.delete({
      userId: user.id,
    });
    await this.verifyTokenRepository.save(
      this.verifyTokenRepository.create({
        userId: user.id,
        token,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    );

    // Send mail
    await this.mailQueue.add(
      MailJobName.SEND_VERIFY_MAIL,
      {
        mail: user.email,
        fullName: profile.fullName,
        verifyLink: `${frontendUrl}/verify?token=${token}`,
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
    measureTime('send mail redis', start);

    const result = await this.userRepository.findOne({
      where: {
        id: user.id,
      },
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
    measureTime('successfuly', start);

    return plainToInstance(UserResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }
  //update
  async update(
    id: number,
    body: UpdateNewUserResDto,
    files: {
      avatar?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    } = {},
  ): Promise<UserResponseDto> {
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

    // Upload files
    const [avatarUpload, coverImageUpload] = await Promise.all([
      files.avatar?.length
        ? await this.cloudinaryService.uploadFileCloudinary(files.avatar[0])
        : Promise.resolve(null),
      files.coverImage?.length
        ? await this.cloudinaryService.uploadFileCloudinary(files.coverImage[0])
        : Promise.resolve(null),
    ]);

    // Update Profile

    await this.profileRepository.update(user.profile.id, {
      fullName: body.fullName ?? user.profile.fullName,
      gender: body.gender ?? user.profile.gender,
      birthday: body.birthday ?? user.profile.birthday,
      phone: body.phone ?? user.profile.phone,

      avatar: avatarUpload?.secure_url ?? user.profile.avatar,
      avatarPublicId: avatarUpload?.public_id ?? user.profile.avatarPublicId,
      coverImage: coverImageUpload?.secure_url ?? user.profile.coverImage,
      coverImagePublicId:
        coverImageUpload?.public_id ?? user.profile.coverImagePublicId,

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

    return plainToInstance(UserResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }
  //read
  async read(): Promise<UserResponseDto[]> {
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
        'user.status',
        'user.failedLoginAttempts',
        'user.lockedUntil',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',

        'profile.id',
        'profile.fullName',
        'profile.avatar',
        'profile.avatarPublicId',
        'profile.coverImage',
        'profile.coverImagePublicId',
        'profile.bio',
        'profile.gender',
        'profile.birthday',
        'profile.phone',
        'profile.height',
        'profile.weight',
        'profile.bodyFat',
        'profile.goal',
        'profile.fitnessLevel',
        'profile.experienceYears',
        'profile.city',
        'profile.country',
        'profile.privacySetting',

        'role.id',
        'role.name',
        'role.code',
      ])
      .getMany();

    return plainToInstance(UserResponseDto, users, {
      excludeExtraneousValues: true,
    });
  }
  //find user by id
  async findById(id: number): Promise<UserResponseDto> {
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

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
  //update status user
  async updateStatus(
    body: UpdateStatusUserDto,
    id: number,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

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

    return plainToInstance(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }
  //delete user
  async delete(id: number): Promise<void> {
    // const user = await this.userRepository.findOne({
    //   where: { id: body.id },
    // });
    // if (!user) throw new InternalServerErrorException('user not exist!');
    // await this.userRepository.delete(body.id);
    const resultRoleUser = await this.userRepository.delete(id);
    if (resultRoleUser.affected === 0)
      throw new NotFoundException('User not found');
  }
}
