import { ProductTag } from 'src/catalogs/entities/product-tag.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false, length: 100 })
  name!: string;

  @Column({ unique: true, nullable: false, length: 100 })
  slug!: string;

  // PRODUCT TAG RELATION
  @OneToMany(() => ProductTag, (productTag) => productTag.tag)
  productTags?: ProductTag;
}
