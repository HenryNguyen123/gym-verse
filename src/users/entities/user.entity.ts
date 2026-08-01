import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Profile } from './profile.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { ResetPasswordToken } from 'src/auth/entities/reset-password-token.entity';
import { AuditLog } from 'src/audits/entities/audit-log.entity';
import { Category } from 'src/categories/entities/category.entity';
import { InventoryLog } from 'src/catalogs/entities/inventory-log.entity';
import { UserStatusEnum } from 'src/users/enums/user.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'user_name',
    unique: true,
    length: 30,
  })
  userName!: string;

  @Column({
    unique: true,
    length: 150,
  })
  email!: string;

  @Column({
    select: false,
  })
  password!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @Column({
    name: 'is_verified',
    type: 'boolean',
    default: false,
  })
  isVerified!: boolean;

  @Column({
    type: 'enum',
    enum: UserStatusEnum,
    default: UserStatusEnum.OFFLINE,
  })
  status!: UserStatusEnum;

  @Column({
    name: 'failed_login_attempts',
    default: 0,
  })
  failedLoginAttempts!: number;

  @Column({
    name: 'locked_until',
    nullable: true,
  })
  lockedUntil?: Date;

  @Column({
    name: 'last_login_at',
    nullable: true,
  })
  lastLoginAt?: Date;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;

  // ================= Relation =================

  @OneToOne(() => Profile, (profile) => profile.user)
  profile!: Profile;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => ResetPasswordToken, (token) => token.user)
  resetTokens!: ResetPasswordToken[];

  @OneToMany(() => AuditLog, (audit) => audit.user)
  auditLogs!: AuditLog[];

  // category RELATION
  @OneToMany(() => Category, (category) => category.createdUser)
  createdCategories?: Category[];

  @OneToMany(() => Category, (category) => category.updatedUser)
  updatedCategories?: Category[];

  // INVENTORY LOGS RELATION
  @OneToMany(() => InventoryLog, (inventoryLog) => inventoryLog.user)
  inventoryLogs?: InventoryLog[];
}
