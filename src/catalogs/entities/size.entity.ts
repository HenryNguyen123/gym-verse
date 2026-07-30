import { ProductVariant } from 'src/catalogs/entities/product-variant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('sizes')
export class Size {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false, length: 50 })
  name!: string;

  @Column({ unique: true, nullable: false, length: 50 })
  code!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // PRODUCT VARIANT RELATION
  @OneToMany(() => ProductVariant, (productVariant) => productVariant.size)
  productVariants?: ProductVariant[];
}
