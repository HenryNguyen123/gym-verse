import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from 'src/auth/dtos/request/login.request.dto';
import { AuthService } from '../services/auth.service';
import { LoginResponseDto } from 'src/auth/dtos/response/login.response.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import { RegisterDto } from 'src/auth/dtos/request/register.request.dto';
import { VerifyDto } from 'src/auth/dtos/request/verify.request.dto';
import { IPayloadJWTLogin } from 'src/auth/interfaces/login.interface';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //step: login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
  ): Promise<LoginResponseDto> {
    return await this.authService.login(loginDto, ip);
  }

  // step: logout
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Ip() ip: string, @Req() req: Request): Promise<void> {
    const user = req['user'] as IPayloadJWTLogin;
    await this.authService.logout(user, ip);
  }

  // step: register
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    type: RegisterDto,
  })
  async register(@Body() registerDto: RegisterDto): Promise<void> {
    await this.authService.register(registerDto);
  }

  // step: send mail verify
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    type: VerifyDto,
  })
  async sendMailVerify(@Body() body: VerifyDto): Promise<void> {
    await this.authService.sendMailVerify(body.email);
  }

  // step: forgot password
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    type: VerifyDto,
  })
  async forgotPassword(@Body() body: VerifyDto): Promise<void> {
    await this.authService.forgotPassword(body);
  }

  // step: reset password
  // @Post('reset password')
  // async resetPassword(@Body() body: string): Promise<void> {
  // await this.authService.resetPassword(body);
  // }
}
