import { Product } from 'src/catalogs/entities/product.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true, name: 'parent_id', type: 'bigint' })
  parentId?: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ nullable: true, type: 'bigint', name: 'created_by' })
  createdBy?: number;

  @Column({ nullable: true, type: 'bigint', name: 'updated_by' })
  updatedBy?: number;

  @Column({
    nullable: true,
    name: 'created_at',
    type: 'timestamp',
    default: 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @Column({
    nullable: true,
    name: 'updated_at',
    type: 'timestamp',
    default: 'CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;

  //SELF RELATION
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children?: Category[];

  // USER RELATION
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

  // PRODUCT RELATION
  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
