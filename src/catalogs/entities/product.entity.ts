import { ProductImage } from 'src/catalogs/entities/product-image.entity';
import { ProductTag } from 'src/catalogs/entities/product-tag.entity';
import { ProductVariant } from 'src/catalogs/entities/product-variant.entity';
import { Category } from 'src/categories/entities/category.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'bigint',
    nullable: true,
    name: 'category_id',
  })
  categoryId?: number;

  @Column({ unique: true, nullable: false, length: 255 })
  name!: string;

  @Column({ unique: true, nullable: false, length: 255 })
  slug!: string;

  @Column({ unique: true, nullable: true, length: 100 })
  sku?: string;

  @Column({ nullable: true, name: 'short_description' })
  shortDescription?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  thumbnail?: string;

  @Column({ nullable: false, precision: 12, scale: 2, type: 'decimal' })
  price!: number;

  @Column({
    nullable: true,
    precision: 12,
    scale: 2,
    type: 'decimal',
    name: 'sale_price',
  })
  salePrice?: number;

  @Column({ nullable: true, default: 0 })
  stock?: number;

  @Column({ nullable: true, name: 'is_active', default: true })
  isActive?: boolean;

  @Column({ nullable: true, name: 'is_featured', default: false })
  isFeatured?: boolean;

  @Column({ nullable: true, type: 'bigint', name: 'created_by' })
  createdBy?: number;

  @Column({ nullable: true, type: 'bigint', name: 'updated_by' })
  updatedBy?: number;

  @CreateDateColumn({ nullable: true, name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ nullable: true, name: 'updated_at' })
  updatedAt?: Date;

  // user RELATION
  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by' })
  createdUser?: User;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'updated_by' })
  updatedUser?: User;

  // CATEGORY RELATION
  @ManyToOne(() => Category, {
    nullable: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  // PRODUCT IMAGE RELATION
  @OneToMany(() => ProductImage, (productImage) => productImage.product)
  productImages!: ProductImage[];

  // PRODUCT VARIANT RELATION
  @OneToMany(() => ProductVariant, (productVariant) => productVariant.product)
  productVariants?: ProductVariant[];

  // PRODUCT TAG RELATION
  @OneToMany(() => ProductTag, (productTag) => productTag.product)
  productTags?: ProductTag[];
}
