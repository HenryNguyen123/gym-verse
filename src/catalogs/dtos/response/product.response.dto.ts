import { Expose, Type } from 'class-transformer';
import { CategoryReadReponse } from 'src/categories/dtos/response/categories-read.response';
import { UserResponseDto } from 'src/users/dtos/response/user.response.dto';

export class ProductDetailResponse {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  sku!: string;

  @Expose()
  shortDescription?: string;

  @Expose()
  description?: string;

  @Expose()
  thumbnail?: string;

  @Expose()
  price!: number;

  @Expose()
  salePrice?: number;

  @Expose()
  isActive!: boolean;

  @Expose()
  isFeatured?: boolean;

  @Expose()
  @Type(() => CategoryReadReponse)
  category!: CategoryReadReponse;

  @Expose()
  @Type(() => UserResponseDto)
  createdBy!: UserResponseDto;

  @Expose()
  @Type(() => UserResponseDto)
  updatedBy!: UserResponseDto;
  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;
}
