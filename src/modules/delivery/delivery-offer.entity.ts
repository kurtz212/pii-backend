import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { DeliveryRequest } from './delivery-request.entity';
import { DeliveryOfferStatus } from './delivery.enums';

@Entity('delivery_offers')
export class DeliveryOffer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DeliveryRequest, { onDelete: 'CASCADE' })
  deliveryRequest: DeliveryRequest;

  @Index()
  @Column()
  deliveryRequestId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  provider: User;

  @Index()
  @Column()
  providerId: string;

  @Column('numeric', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'uuid', nullable: true })
  espaceId: string | null;

  @Column({ type: 'enum', enum: DeliveryOfferStatus, default: DeliveryOfferStatus.PENDING })
  status: DeliveryOfferStatus;

  @CreateDateColumn()
  createdAt: Date;
}