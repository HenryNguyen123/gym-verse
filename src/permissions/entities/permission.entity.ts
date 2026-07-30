import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { RolePermission } from 'src/permissions/entities/role-permission.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', nullable: true })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;

  @Column({ unique: true, nullable: true })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  code: string;

  @Column({ nullable: true })
  @IsString()
  description: string;

  @Column({ nullable: true })
  @IsString()
  module: string;

  @Column({ name: 'created_at' })
  created_at: Date;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: RolePermission[];
}
