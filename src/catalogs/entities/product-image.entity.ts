import { Product } from 'src/catalogs/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, type: 'bigint', name: 'product_id' })
  productId!: number;

  @Column({ nullable: false, name: 'image_url' })
  imageUrl!: string;

  @Column({ nullable: true, default: false, name: 'is_thumbnail' })
  isThumbnail?: boolean;

  @CreateDateColumn({ nullable: false, name: 'created_at' })
  createdAt!: Date;

  // PRODUCT RELATION
  @ManyToOne(() => Product, (product) => product.productImages, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
