import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @Column({ name: 'token', nullable: false })
  @IsString()
  @IsNotEmpty()
  token: string;

  @Column({ name: 'expires_at', nullable: false })
  @IsDate()
  @IsNotEmpty()
  expiresAt: Date;

  @Column({ name: 'created_at' })
  @IsDate()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
