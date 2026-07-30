import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('verify_tokens')
export class VerifyToken {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ unique: true })
  @IsNotEmpty()
  @MinLength(10)
  @IsString()
  token?: string;

  @Column({ name: 'user_id' })
  @IsNotEmpty()
  @IsNumber()
  userId?: number;

  @Column({ name: 'expired_at' })
  @IsNotEmpty()
  @IsDate()
  expiredAt?: Date;

  @Column({ default: false, name: 'is_used' })
  isUsed?: boolean;

  @Column({ name: 'created_at' })
  @IsNotEmpty()
  @IsDate()
  createdAt?: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
