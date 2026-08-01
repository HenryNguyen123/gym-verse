import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';
import {
  FitnessGoalEnum,
  FitnessLevelEnum,
  GenderEnum,
  PrivacySettingEnum,
} from 'src/users/enums/profile.enum';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'full_name',
    length: 100,
  })
  fullName!: string;

  @Column({
    nullable: true,
    length: 255,
  })
  avatar?: string;

  @Column({
    name: 'cover_image',
    nullable: true,
    length: 255,
  })
  coverImage?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  bio?: string;

  @Column({
    type: 'enum',
    enum: GenderEnum,
    nullable: true,
  })
  gender?: GenderEnum;

  @Column({
    type: 'date',
    nullable: true,
  })
  birthday?: Date;

  @Column({
    nullable: true,
    length: 20,
  })
  phone?: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  height?: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  weight?: number;

  @Column({
    name: 'body_fat',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  bodyFat?: number;

  @Column({
    type: 'enum',
    enum: FitnessGoalEnum,
    nullable: true,
  })
  goal?: FitnessGoalEnum;

  @Column({
    name: 'fitness_level',
    type: 'enum',
    enum: FitnessLevelEnum,
    default: FitnessLevelEnum.BEGINNER,
  })
  fitnessLevel!: FitnessLevelEnum;

  @Column({
    name: 'experience_years',
    default: 0,
  })
  experienceYears!: number;

  @Column({
    nullable: true,
    length: 100,
  })
  city?: string;

  @Column({
    nullable: true,
    length: 100,
  })
  country?: string;

  @Column({
    name: 'privacy_setting',
    type: 'enum',
    enum: PrivacySettingEnum,
    default: PrivacySettingEnum.PUBLIC,
  })
  privacySetting!: PrivacySettingEnum;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;

  // ================= Relation =================

  @OneToOne(() => User, (user) => user.profile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user!: User;
}
