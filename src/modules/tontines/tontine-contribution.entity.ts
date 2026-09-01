import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Tontine } from './tontine.entity';
import { ContributionStatus } from './tontine.enums';

@Entity('tontine_contributions')
export class TontineContribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tontine, { onDelete: 'CASCADE' })
  tontine: Tontine;

  @Index()
  @Column()
  tontineId: string;

  @Column({ type: 'int' })
  roundNumber: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  participant: User;

  @Index()
  @Column()
  participantId: string;

  @Column({ type: 'enum', enum: ContributionStatus, default: ContributionStatus.PENDING })
  status: ContributionStatus;

  @UpdateDateColumn()
  updatedAt: Date;
}