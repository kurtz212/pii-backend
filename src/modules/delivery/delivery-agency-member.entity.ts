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
import { Espace } from '../espaces/espace.entity';

@Entity('delivery_agency_members')
@Unique(['espaceId', 'livreurId'])
export class DeliveryAgencyMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Espace, { onDelete: 'CASCADE' })
  espace: Espace;

  @Index()
  @Column()
  espaceId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  livreur: User;

  @Index()
  @Column()
  livreurId: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'accepted';

  @CreateDateColumn()
  joinedAt: Date;
}