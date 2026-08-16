import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserService } from 'src/users/services/user.service';
import { User } from 'src/users/entities/user.entity';
import { Profile } from 'src/users/entities/profile.entity';
import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { VerifyToken } from 'src/auth/entities/verify-token.entity';
import { MailModule } from 'src/mails/mail.module';
import { AuthModule } from 'src/auth/auth.module';
import { CloudinaryService } from 'src/cloudinary/services/cloudinary.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { BullModule } from '@nestjs/bullmq';
import { UserAdminController } from 'src/users/controllers/admin/user.admin.controller';
import { UserController } from 'src/users/controllers/client/user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Role, UserRole, VerifyToken]),
    BullModule.registerQueue({
      name: 'mail',
    }),
    AuthModule,
    MailModule,
    CloudinaryModule,
  ],
  controllers: [UserAdminController, UserController],
  providers: [UserService, CloudinaryService],
  exports: [UserService],
})
export class UserModule {}
