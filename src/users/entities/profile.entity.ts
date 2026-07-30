import { IsDate, IsString, MaxLength, MinLength } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'full_name' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  fullName!: string;

  @Column({ nullable: true })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  gender?: string;

  @Column({ nullable: true })
  @IsDate()
  dob?: Date;

  @Column({ nullable: true })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  phone?: string;

  @Column({ nullable: true })
  @IsString()
  avatar?: string;

  @Column({ name: 'created_at' })
  @IsDate()
  createdAt?: Date;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
