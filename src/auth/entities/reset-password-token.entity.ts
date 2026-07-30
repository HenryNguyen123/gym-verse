// src/modules/auth/entities/reset-password-token.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { IsNotEmpty, IsNumber, MinLength } from 'class-validator';

@Entity('reset_password_tokens')
export class ResetPasswordToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @Column({ unique: true })
  @IsNotEmpty()
  @MinLength(10)
  token: string;

  @Column({
    name: 'expired_at',
    type: 'timestamp',
  })
  @IsNotEmpty()
  expiredAt: Date;

  @Column({
    name: 'is_used',
    type: 'boolean',
    default: false,
  })
  isUsed: boolean;

  @ManyToOne(() => User, (user) => user.resetTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;
}
