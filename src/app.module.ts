import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import 'dotenv/config';
import { join } from 'path';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { CategoryModule } from 'src/categories/category.module';
import { PermissionModule } from 'src/permissions/permission.module';
import { MailModule } from 'src/mails/mail.module';
import { UserModule } from 'src/users/user.module';
import { RoleModule } from 'src/roles/role.module';
import { CatalogModule } from 'src/catalogs/catalog.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [join(__dirname, '**/*.entity{.ts,.js}')],
      synchronize: false,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
      signOptions: { expiresIn: '1h' },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    RedisModule,
    CategoryModule,
    PermissionModule,
    MailModule,
    UserModule,
    RoleModule,
    CategoryModule,
    CatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
