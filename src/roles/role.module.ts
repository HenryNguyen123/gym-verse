import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { RoleController } from 'src/roles/controllers/role.controller';
import { UserRoleController } from 'src/roles/controllers/user-role.controller';
import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { RoleService } from 'src/roles/services/role.service';
import { UserRoleService } from 'src/roles/services/user-role.service';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, UserRole, User]), AuthModule],
  controllers: [RoleController, UserRoleController],
  providers: [RoleService, UserRoleService],
  exports: [RoleService],
})
export class RoleModule {}
