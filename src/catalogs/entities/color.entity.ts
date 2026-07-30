import { ProductVariant } from 'src/catalogs/entities/product-variant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('colors')
export class Color {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false, length: 100 })
  name!: string;

  @Column({ unique: true, nullable: false, length: 50 })
  code!: string;

  @Column({ nullable: false, name: 'hex_code', length: 20 })
  hexCode!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // PRODUCT VARIANT RELATION
  @OneToMany(() => ProductVariant, (productVariant) => productVariant.color)
  productVariants?: ProductVariant[];
}
