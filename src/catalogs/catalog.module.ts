import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { ProductController } from 'src/catalogs/controllers/product.controller';
import { Product } from 'src/catalogs/entities/product.entity';
import { ProductService } from 'src/catalogs/services/product.service';
import { Category } from 'src/categories/entities/category.entity';
import { MailModule } from 'src/mails/mail.module';
import { Role } from 'src/roles/entities/role.entity';
import { UserRole } from 'src/roles/entities/user-role.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserRole, Category, Product]),
    AuthModule,
    MailModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class CatalogModule {}
