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
import { Order } from '../orders/order.entity';

@Entity('reviews')
@Unique(['orderId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Espace, { onDelete: 'CASCADE' })
  espace: Espace;

  @Index()
  @Column()
  espaceId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  author: User;

  @Index()
  @Column()
  authorId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  order: Order;

  @Column()
  orderId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;
}