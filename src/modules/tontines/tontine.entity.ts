import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { TontineStatus } from './tontine.enums';

@Entity('tontines')
export class Tontine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  creator: User;

  @Index()
  @Column()
  creatorId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('numeric', { precision: 12, scale: 2 })
  contributionAmount: number;

  @Column({ type: 'int' })
  maxParticipants: number;

  @Column({ type: 'enum', enum: TontineStatus, default: TontineStatus.DRAFT })
  status: TontineStatus;

  @CreateDateColumn()
  createdAt: Date;
}