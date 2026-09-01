import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Tontine } from './tontine.entity';

@Entity('tontine_participants')
@Unique(['tontineId', 'userId'])
export class TontineParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tontine, { onDelete: 'CASCADE' })
  tontine: Tontine;

  @Index()
  @Column()
  tontineId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'int', nullable: true })
  proposedOrder: number | null;

  @Column({ type: 'int', nullable: true })
  confirmedOrder: number | null;

  @CreateDateColumn()
  joinedAt: Date;
}