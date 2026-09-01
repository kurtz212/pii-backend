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
import { DeliveryRequest } from './delivery-request.entity';

@Entity('delivery_reviews')
@Unique(['deliveryRequestId'])
export class DeliveryReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DeliveryRequest, { onDelete: 'CASCADE' })
  deliveryRequest: DeliveryRequest;

  @Column()
  deliveryRequestId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  client: User;

  @Index()
  @Column()
  clientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  provider: User;

  @Index()
  @Column()
  providerId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;
}