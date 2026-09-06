import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { EspaceType } from './espace-type.enum';

@Entity('espaces')
export class Espace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner: User;

  @Index()
  @Column()
  ownerId: string;

  @Column({ type: 'enum', enum: EspaceType })
  type: EspaceType;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

   @Column({ type: 'varchar', length: 150, nullable: true })
  location: string | null;

  // Chemin relatif renvoyé par POST /uploads/image — logo/photo de
  // profil de l'espace, affiché dans l'Annuaire et le profil public.
  @Column({ type: 'varchar', length: 255, nullable: true })
  photoUrl: string | null;

  @Column({ type: 'jsonb', default: {} })
  details: Record<string, unknown>;

  @Column({ default: false })
  subscriptionActive: boolean;

  @Column({ type: 'varchar', length: 20 })
  affiliationCodeUsed: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}