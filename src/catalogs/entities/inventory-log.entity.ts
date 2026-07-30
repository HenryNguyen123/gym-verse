import { ProductVariant } from 'src/catalogs/entities/product-variant.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('inventory_logs')
export class InventoryLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'bigint', nullable: false, name: 'product_variant_id' })
  productVariantId!: number;

  @Column({ nullable: false, length: 50 })
  type!: string;

  @Column({ type: 'integer', nullable: false })
  quantity!: number;

  @Column({ type: 'text' })
  note?: string;

  @Column({ type: 'bigint', name: 'created_by' })
  createdBy?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  // PRODUCT VARIANT RELATION
  @ManyToOne(() => ProductVariant, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_variant_id' })
  productVariants!: ProductVariant;

  // USER RELATION
  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by' })
  user!: User;
}
