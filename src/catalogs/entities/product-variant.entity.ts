import { Color } from 'src/catalogs/entities/color.entity';
import { InventoryLog } from 'src/catalogs/entities/inventory-log.entity';
import { Product } from 'src/catalogs/entities/product.entity';
import { Size } from 'src/catalogs/entities/size.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'bigint', nullable: false, name: 'product_id' })
  productId!: number;

  @Column({ type: 'bigint', name: 'color_id' })
  colorId?: number;

  @Column({ type: 'bigint', name: 'size_id' })
  sizeId?: number;

  @Column({ unique: true })
  sku!: string;

  @Column({
    precision: 12,
    scale: 2,
    type: 'decimal',
  })
  price?: number;

  @Column({
    precision: 12,
    scale: 2,
    type: 'decimal',
    name: 'sale_price',
  })
  salePrice?: number;

  @Column({ default: 0, type: 'integer' })
  stock?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  // PRODUCT VARIANT RELATION
  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  // VARIANT COLOR RELATION
  @ManyToOne(() => Color, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'color_id' })
  color?: Color;

  // VARIANT SIZE RELATION
  @ManyToOne(() => Size, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'size_id' })
  size?: Size;

  // INVENTORY LOGS RELATION
  @OneToMany(() => InventoryLog, (inventoryLog) => inventoryLog.productVariants)
  inventoryLogs?: InventoryLog[];
}
