import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { RolePermission } from 'src/permissions/entities/role-permission.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'name', nullable: true })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name!: string;

  @Column({ unique: true, nullable: true })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  code!: string;

  @Column({ nullable: true })
  @IsString()
  description?: string;

  @Column({ name: 'created_at' })
  created_at!: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles!: UserRole[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions!: RolePermission[];
}
