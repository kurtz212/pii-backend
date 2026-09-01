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