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
import { DeliveryRequestStatus } from './delivery.enums';

@Entity('delivery_requests')
export class DeliveryRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  client: User;

  @Index()
  @Column()
  clientId: string;

  @Column({ length: 200 })
  depart: string;

  @Column({ length: 200 })
  destination: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  packageSize: string | null;

  @Column({ default: false })
  isFragile: boolean;

  // Livraison groupée : le client a commandé dans plusieurs boutiques
  // et demande UNE seule livraison qui passe récupérer chez chacune
  // avant de tout livrer à une destination unique.
  @Column({ default: false })
  isGrouped: boolean;

  // Snapshot des points de collecte au moment de la création — nom
  // de la boutique, sa localisation, la commande concernée. Reste
  // stable même si la boutique change ses infos plus tard.
   @Column({ type: 'jsonb', nullable: true })
  pickupPoints:
    | { espaceId: string; espaceName: string; location: string | null; orderId: string; title: string }[]
    | null;

  // Historique des étapes réelles de la livraison, mises à jour par
  // le livreur — permet un suivi précis au-delà du simple statut
  // global (open/assigned/completed).
  @Column({ type: 'jsonb', default: () => "'[]'" })
  trackingSteps: { step: string; note: string | null; at: string }[];
  @Column({ type: 'enum', enum: DeliveryRequestStatus, default: DeliveryRequestStatus.OPEN })
  status: DeliveryRequestStatus;

  @Column({ type: 'uuid', nullable: true })
  acceptedOfferId: string | null;

  @Column({ type: 'uuid', nullable: true })
  assignedLivreurId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}