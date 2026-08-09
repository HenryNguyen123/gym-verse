import { PermissionController } from 'src/permissions/controllers/permission.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from 'src/permissions/entities/permission.entity';
import { PermissionService } from 'src/permissions/services/permission.service';
import { RolePermission } from 'src/permissions/entities/role-permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { RedisService } from 'src/redis/redis.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, RolePermission, Role])],
  controllers: [PermissionController],
  providers: [PermissionService, RedisService],
  exports: [PermissionService],
})
export class PermissionModule {}
