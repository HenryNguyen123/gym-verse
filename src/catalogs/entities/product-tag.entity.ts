import { Product } from 'src/catalogs/entities/product.entity';
import { Tag } from 'src/catalogs/entities/tag.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('product_tags')
export class ProductTag {
  @PrimaryColumn({ type: 'bigint', nullable: false, name: 'product_id' })
  productid!: number;

  @PrimaryColumn({ type: 'bigint', nullable: false, name: 'tag_id' })
  tagId!: number;

  // PRODUCT RELATION
  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  //TAG RELATION
  @ManyToOne(() => Tag, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
