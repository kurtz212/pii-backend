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

    // proposedOrder est desormais defini par le CREATEUR (proposition
  // du calendrier), pas librement par le participant lui-meme.
  @Column({ type: 'int', nullable: true })
  proposedOrder: number | null;

  // Contre-proposition du participant s'il n'est pas d'accord avec
  // l'ordre propose par le createur.
  @Column({ type: 'int', nullable: true })
  requestedOrder: number | null;

  // Reponse du participant a la proposition en cours du createur.
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  responseStatus: 'pending' | 'validated' | 'amended';

  @Column({ type: 'int', nullable: true })
  confirmedOrder: number | null;
  @CreateDateColumn()
  joinedAt: Date;
}