import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'crypto';
import { VerifyToken } from 'src/auth/entities/verify-token.entity';
import { hashPassword } from 'src/commons/utils/password.util';
import { pathFileName } from 'src/commons/utils/path-file-name.util';
import { MailService } from 'src/mails/services/mail.service';
import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { RoleEnum } from 'src/roles/enums/role.enum';
import { CreateUserDto } from 'src/users/dtos/request/create-user.dto';
import { DeleteUserDto } from 'src/users/dtos/request/delete-user.request.dto';
import { UpdateNewUserResDto } from 'src/users/dtos/request/update-new-user.request.dto';
import { UpdateStatusUserDto } from 'src/users/dtos/request/update-status.request.dto';
import { ReadUserResponseDto } from 'src/users/dtos/response/read-user.response.dto';
import { UserResponseDto } from 'src/users/dtos/response/user.response.dto';
import { Profile } from 'src/users/entities/profile.entity';
import { User } from 'src/users/entities/user.entity';
import { IUserPayload } from 'src/users/interfaces/user.interface';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
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
  ) {}
  //create user
  async create(
    createUserDto: CreateUserDto,
    file: Express.Multer.File | null,
    path: string,
  ) {
    const { email, password, userName, fullName, gender, dob, phone } =
      createUserDto;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    // check user exits
    const userCheck = await this.userRepository.findOne({
      where: [{ email }, { userName }],
    });
    if (userCheck)
      throw new ConflictException('Email or username already exists');
    // hash password
    const hash = await hashPassword(password);
    // create new user
    const userEntity = this.userRepository.create({
      email,
      password: hash,
      userName,
    });
    await this.userRepository.save(userEntity);
    //create new profile
    let pathAvatar: string | null = null;
    if (file) {
      pathAvatar = pathFileName(file, path);
    }
    const profileEntity = this.profileRepository.create({
      user: userEntity,
      fullName,
      gender,
      dob,
      phone,
      avatar: pathAvatar ?? undefined,
    });
    await this.profileRepository.save(profileEntity);
    // check role and get role
    const role = await this.roleRepository.findOneBy({
      code: RoleEnum.USER,
    });
    if (!role) throw new InternalServerErrorException('Role not found');
    // create new user role
    const userRoleEntity = this.userRoleRepository.create({
      user: userEntity,
      role,
    });
    await this.userRoleRepository.save(userRoleEntity);
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
    await this.mailService.sendVerifyMail(
      email,
      profileEntity.fullName,
      `${frontendUrl}/verify?token=${uuid}`,
      '24h',
    );
  }
  //update
  async update(
    id: number,
    body: UpdateNewUserResDto,
    file: Express.Multer.File | null,
    path: string,
  ) {
    // const email: string = body.email;
    const roleCode: string | null = body.roleCode ?? null;
    const userCheck = await this.userRepository.findOne({
      where: [{ id }, { id }],
      relations: {
        profile: true,
        userRoles: true,
      },
    });
    if (!userCheck) throw new NotFoundException('User already exists');
    //update profile
    let pathAvatar: string | null = null;
    if (file) {
      pathAvatar = pathFileName(file, path);
    }
    const resultProfile = await this.profileRepository.update(userCheck.id, {
      fullName: body.fullName ?? userCheck.profile.fullName,
      gender: body.gender ?? userCheck.profile.gender,
      dob: body.dob ?? userCheck.profile.dob,
      phone: body.phone ?? userCheck.profile.phone,
      avatar: pathAvatar ?? userCheck.profile.avatar,
    });
    if (!resultProfile.affected)
      throw new NotFoundException('profile not found');
    //update role
    if (roleCode) {
      const roleCheck = await this.roleRepository.findOne({
        where: { code: roleCode },
      });
      if (!roleCheck) throw new NotFoundException('Role not found');
      const roleUser = await this.userRoleRepository.findOne({
        where: { userId: userCheck.id },
        relations: { role: true },
      });
      if (!roleUser) throw new NotFoundException('UserRole not found');
      await this.userRoleRepository.delete({ userId: userCheck.id });
      const resultRoleUser = await this.userRoleRepository.save({
        userId: userCheck.id,
        roleId: roleCheck.id,
      });
      if (!resultRoleUser) throw new NotFoundException('UserRole not found');
    }
    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: {
        profile: true,
        userRoles: {
          role: true,
        },
      },
    });
    const roles =
      user?.userRoles.map((ur) => ({
        name: ur.role.name,
        code: ur.role.code,
      })) ?? [];
    if (!user) throw new NotFoundException('user not found');
    const payload: IUserPayload = {
      email: user.email,
      userName: user.userName,
      isActive: user.isActive,
      role: roles,
      profile: {
        fullName: user.profile.fullName,
        gender: user.profile.gender,
        dob: user.profile.dob,
        phone: user.profile.phone,
        avatar: user.profile.avatar,
      },
    };
    return plainToInstance(UserResponseDto, {
      user: payload,
    });
  }
  //read
  async read() {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .select([
        'user.id',
        'user.userName',
        'user.email',
        'user.isActive',
        'user.createdAt',

        'profile.id',
        'profile.fullName',
        'profile.phone',
        'profile.avatar',

        'userRole.userId',
        'userRole.roleId',

        'role.id',
        'role.name',
        'role.code',
      ])
      .getMany();

    //payload
    const payload = user.map((u) => ({
      userId: u.id,
      userName: u.userName,
      email: u.email,
      isActive: u.isActive,
      createdAt: u.createdAt,
      profileId: u.profile.id,
      fullName: u.profile.fullName,
      phone: u.profile.phone,
      avatar: u.profile.avatar,
      roleId: u.userRoles.map((ur) => ur.role.id),
      nameRole: u.userRoles.map((ur) => ur.role.name),
      codeRole: u.userRoles.map((ur) => ur.role.code),
    }));
    return plainToInstance(ReadUserResponseDto, {
      user: payload,
    });
  }
  //find user by id
  async findById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: {
        profile: true,
      },
    });
    if (!user) throw new InternalServerErrorException('user not exist!');
    // const userID = user.id;
    // const userRole = await this.userRoleRepository.findOne({
    //   where: { userId: userID },
    // });
    // const roleId = userRole?.roleId;
    // const roles = await this.roleRepository.findOne({
    //   where: { id: roleId },
    // });
    const roles = user.userRoles.map((userRole) => {
      return {
        name: userRole.role.name,
        code: userRole.role.code,
      };
    });
    // const roleCode = user.userRoles.map((userRole) => {
    //   return userRole.role.code;
    // });
    // const permissionCodes = user.userRoles.flatMap((userRole) =>
    //   userRole.role.rolePermissions.map((rp) => rp.permission.code),
    // );
    if (!roles) throw new InternalServerErrorException('role not exist!');
    const payload: IUserPayload = {
      email: user.email,
      userName: user.userName,
      isActive: user.isActive,
      role: roles,
      profile: {
        fullName: user.profile.fullName,
        gender: user.profile.gender,
        dob: user.profile.dob,
        phone: user.profile.phone,
        avatar: user.profile.avatar,
      },
    };
    return plainToInstance(UserResponseDto, {
      user: payload,
    });
  }
  //update status user
  async updateStatus(body: UpdateStatusUserDto, id: number) {
    const userCheck = await this.userRepository.findOne({
      where: { id },
    });
    if (!userCheck) throw new InternalServerErrorException('user not exist!');
    const result = await this.userRepository.update(id, {
      isActive: body.isActive,
    });
    if (!result) throw new InternalServerErrorException('user not exist!');
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        profile: true,
        userRoles: {
          role: true,
        },
      },
    });
    if (!user) throw new InternalServerErrorException('user not exist!');
    const roles =
      user?.userRoles.map((ur) => ({
        name: ur.role.name,
        code: ur.role.code,
      })) ?? [];
    const payload: IUserPayload = {
      email: user.email,
      userName: user.userName,
      isActive: user.isActive,
      role: roles,
      profile: {
        fullName: user.profile.fullName,
        gender: user.profile.gender,
        dob: user.profile.dob,
        phone: user.profile.phone,
        avatar: user.profile.avatar,
      },
    };
    return plainToInstance(UserResponseDto, {
      user: payload,
    });
  }
  //delete user
  async delete(body: DeleteUserDto) {
    const userId: number = body.id;
    // const user = await this.userRepository.findOne({
    //   where: { id: body.id },
    // });
    // if (!user) throw new InternalServerErrorException('user not exist!');
    // await this.userRepository.delete(body.id);
    const resultRoleUser = await this.userRepository.delete(userId);
    if (resultRoleUser.affected === 0)
      throw new NotFoundException('User not found');
  }
}
