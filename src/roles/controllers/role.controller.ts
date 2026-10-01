import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleAdminGuard } from 'src/auth/guards/role-admin.guard';
import { IJwtPayload } from 'src/auth/interfaces/jwt.interface';
import { QueryRoleRequestDto } from 'src/roles/dtos/request/query-pagination.request.dto';
import { RoleCreateRequest } from 'src/roles/dtos/request/role-create.request.dto';
import { UpdateRoleRequest } from 'src/roles/dtos/request/role-update.request.dto';
import { RoleFindByIdReponse } from 'src/roles/dtos/response/role-find-by-id.resquest.dto';
import { RolesPaginationResponseDto } from 'src/roles/dtos/response/role-pagination.response.dto';
import { RoleResponseDto } from 'src/roles/dtos/response/role.response.dto';
import { RoleService } from 'src/roles/services/role.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RoleAdminGuard)
export class RoleController {
  constructor(private roleService: RoleService) {}
  //create role by admin
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    type: RoleCreateRequest,
  })
  @ApiResponse({
    description: 'create role successfully',
  })
  async create(@Req() req: Request, @Body() body: RoleCreateRequest) {
    const jwtPayload = req['user'] as IJwtPayload;
    await this.roleService.create(jwtPayload, body);
  }

  //read role by admin
  @Get()
  async read(body: QueryRoleRequestDto): Promise<RolesPaginationResponseDto> {
    return await this.roleService.getRolepagination(body);
  }

  //update role by admin
  @Patch(':id')
  @ApiBody({
    type: UpdateRoleRequest,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRoleRequest,
  ): Promise<RoleResponseDto> {
    return await this.roleService.update(id, body);
  }

  //delete role by admin
  @Delete('destroy')
  @HttpCode(HttpStatus.NO_CONTENT)
  async destroy(@Param('id', ParseIntPipe) id: number) {
    await this.roleService.destroy(id);
  }

  // find role by id
  @Get(':id')
  async findbyId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RoleFindByIdReponse> {
    return await this.roleService.findbyId(id);
  }
}
