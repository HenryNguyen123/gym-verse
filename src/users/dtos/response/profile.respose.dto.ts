import { Expose } from 'class-transformer';
import {
  FitnessGoalEnum,
  FitnessLevelEnum,
  GenderEnum,
  PrivacySettingEnum,
} from 'src/users/enums/profile.enum';

export class ProfileResponseDto {
  @Expose()
  fullName!: string;

  @Expose()
  avatar?: string;

  @Expose()
  coverImage?: string;

  @Expose()
  bio?: string;

  @Expose()
  gender?: GenderEnum;

  @Expose()
  birthday?: Date;

  @Expose()
  phone?: string;

  @Expose()
  height?: number;

  @Expose()
  weight?: number;

  @Expose()
  bodyFat?: number;

  @Expose()
  goal?: FitnessGoalEnum;

  @Expose()
  fitnessLevel!: FitnessLevelEnum;

  @Expose()
  experienceYears!: number;

  @Expose()
  city?: string;

  @Expose()
  country?: string;

  @Expose()
  privacySetting!: PrivacySettingEnum;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
