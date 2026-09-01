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
import { EspaceType } from '../espaces/espace-type.enum';
import { QuoteRequestStatus } from './quote.enums';

// Une demande de devis cible soit une liste précise d'agences
// (targetEspaceIds rempli), soit toutes les agences du bon type si le
// client a choisi "Toutes les agences" (targetEspaceIds vide/null —
// diffusion large). Chaque agence ciblée peut répondre avec son propre
// Quote ; le client choisit ensuite lequel accepter.
@Entity('quote_requests')
export class QuoteRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  client: User;

  @Index()
  @Column()
  clientId: string;

  @Column({ type: 'enum', enum: EspaceType })
  targetType: EspaceType; // agence_cargo ou transitaire

  // Liste d'IDs d'espaces ciblés — null ou tableau vide = diffusion à
  // toutes les agences du targetType.
  @Column({ type: 'jsonb', nullable: true })
  targetEspaceIds: string[] | null;

  // Détails structurés, différents selon targetType :
  // cargo -> { originCountry, destinationCountry, weightKg, merchandiseDescription }
  // transitaire -> { containerSize, containerPosition, containerCapacity, destinationZone }
  @Column({ type: 'jsonb' })
  details: Record<string, unknown>;

  @Column({ type: 'enum', enum: QuoteRequestStatus, default: QuoteRequestStatus.OPEN })
  status: QuoteRequestStatus;

  @Column({ type: 'uuid', nullable: true })
  acceptedQuoteId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}