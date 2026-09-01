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
import { Publication } from '../publications/publication.entity';
import { Espace } from '../espaces/espace.entity';
import { OrderStatus, PaymentMethod, ReceptionMode } from './order.enums';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  client: User;

  @Index()
  @Column()
  clientId: string;

  @ManyToOne(() => Publication, { onDelete: 'CASCADE' })
  publication: Publication;

  @Index()
  @Column()
  publicationId: string;

  @ManyToOne(() => Espace, { onDelete: 'CASCADE' })
  espace: Espace;

  @Index()
  @Column()
  espaceId: string;

  @Index()
  @Column()
  sellerId: string;

  @Column({ length: 150 })
  title: string;

  @Column('numeric', { precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: ReceptionMode })
  receptionMode: ReceptionMode;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}