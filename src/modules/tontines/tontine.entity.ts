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

  // Article vise par la tontine - ex: "Television" a 75000 F. Permet
  // aux participants de savoir precisement ce que la cagnotte va
  // financer, tour a tour, pour chacun.
     @Column({ type: 'varchar', length: 150, nullable: true })
  articleName: string | null;

  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  articlePrice: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  articleImageUrl: string | null;

  // Regles definies par le createur - confidentialite, engagement,
  // consequences en cas de defaut de paiement, etc. Presentee aux
  // participants avant qu'ils rejoignent, comme la politique de
  // travail des agences de livraison.
  @Column({ type: 'text', nullable: true })
  confidentialityPolicy: string | null;

  @Column('numeric', { precision: 12, scale: 2 })
  contributionAmount: number;

  @Column({ type: 'int' })
  maxParticipants: number;

  @Column({ type: 'enum', enum: TontineStatus, default: TontineStatus.DRAFT })
  status: TontineStatus;

  @CreateDateColumn()
  createdAt: Date;
}
