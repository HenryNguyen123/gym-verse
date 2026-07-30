import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from 'src/auth/controllers/auth.controller';
import { User } from 'src/users/entities/user.entity';
import { AuthService } from 'src/auth/services/auth.service';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { RedisService } from 'src/redis/redis.service';
import { Profile } from 'src/users/entities/profile.entity';
import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { VerifyToken } from 'src/auth/entities/verify-token.entity';
import { MailModule } from 'src/mails/mail.module';
import { ResetPasswordToken } from 'src/auth/entities/reset-password-token.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      RefreshToken,
      Profile,
      Role,
      UserRole,
      VerifyToken,
      ResetPasswordToken,
    ]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
      signOptions: { expiresIn: '1d' },
    }),
    MailModule,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
  providers: [AuthService, RedisService, JwtService],
})
export class AuthModule {}
