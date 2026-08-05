import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleAdminGuard } from 'src/auth/guards/role-admin.guard';
import { UserRoleService } from 'src/roles/services/user-role.service';

@ApiTags('user-role')
@Controller('user-role')
@ApiBearerAuth()
export class UserRoleController {
  constructor(private userRoleService: UserRoleService) {}
  //create
  @Post()
  @UseGuards(JwtAuthGuard, RoleAdminGuard)
  async create() {}
  //read
  @Get()
  async read() {}
  //update
  @Patch(':userId')
  async update(@Param('userId', ParseIntPipe) userId: number) {}
  //delele
  @Delete(':userId')
  async remove(@Param('userId', ParseIntPipe) userId: number) {}
}
