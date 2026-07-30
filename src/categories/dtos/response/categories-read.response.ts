import { Expose } from 'class-transformer';

export class CategoryReadReponse {
  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  description?: string;

  @Expose()
  image?: string;

  @Expose()
  parentId?: number;

  @Expose()
  isActive?: boolean;

  @Expose()
  createdAt?: Date;
}
