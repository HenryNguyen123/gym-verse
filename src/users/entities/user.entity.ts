import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AuditLog } from 'src/audits/entities/audit-log.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { ResetPasswordToken } from 'src/auth/entities/reset-password-token.entity';
import { InventoryLog } from 'src/catalogs/entities/inventory-log.entity';
import { Category } from 'src/categories/entities/category.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { Profile } from 'src/users/entities/profile.entity';
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_name', unique: true })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  userName!: string;

  @Column({ unique: true })
  @IsEmail()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(150)
  email!: string;

  @Column({ select: false })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @Column({ name: 'is_active', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ name: 'is_verified' })
  @IsBoolean()
  isVerified?: boolean;

  @Column({ name: 'failed_login_attempts' })
  @IsNumber()
  failedLoginAttempts?: number;

  @Column({ name: 'locked_until' })
  @IsDate()
  lockedUntil?: Date;

  @Column({ name: 'last_login_at' })
  @IsDate()
  lastLoginAt?: Date;

  @Column({ name: 'created_at' })
  @IsDate()
  createdAt?: Date;

  @Column({ name: 'updated_at' })
  @IsDate()
  updatedAt?: Date;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile!: Profile;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens?: RefreshToken[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs?: AuditLog[];

  @OneToMany(() => ResetPasswordToken, (token) => token.user)
  resetTokens?: ResetPasswordToken[];

  // category RELATION
  @OneToMany(() => Category, (category) => category.createdUser)
  createdCategories?: Category[];

  @OneToMany(() => Category, (category) => category.updatedUser)
  updatedCategories?: Category[];

  // INVENTORY LOGS RELATION
  @OneToMany(() => InventoryLog, (inventoryLog) => inventoryLog.user)
  inventoryLogs?: InventoryLog[];
}
