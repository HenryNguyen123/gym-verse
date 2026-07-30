import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controllers/user.controller';
import { Module } from '@nestjs/common';
import { UserService } from 'src/users/services/user.service';
import { User } from 'src/users/entities/user.entity';
import { Profile } from 'src/users/entities/profile.entity';
import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { VerifyToken } from 'src/auth/entities/verify-token.entity';
import { MailModule } from 'src/mails/mail.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Role, UserRole, VerifyToken]),
    AuthModule,
    MailModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
