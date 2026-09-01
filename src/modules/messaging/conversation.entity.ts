import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

// Une conversation à deux participants. Pour éviter les doublons (A->B
// et B->A), le service normalise toujours l'ordre des deux IDs avant
// de chercher/créer une conversation (voir MessagingService.orderPair).
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  participantOne: User;

  @Index()
  @Column()
  participantOneId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  participantTwo: User;

  @Index()
  @Column()
  participantTwoId: string;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}