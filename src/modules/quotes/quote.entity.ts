import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { QuoteRequest } from './quote-request.entity';
import { Espace } from '../espaces/espace.entity';

// Une réponse d'une agence précise à une demande de devis — plusieurs
// agences peuvent répondre à la même demande (une seule fois chacune).
@Entity('quotes')
@Unique(['quoteRequestId', 'espaceId'])
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => QuoteRequest, { onDelete: 'CASCADE' })
  quoteRequest: QuoteRequest;

  @Index()
  @Column()
  quoteRequestId: string;

  @ManyToOne(() => Espace, { onDelete: 'CASCADE' })
  espace: Espace;

  @Index()
  @Column()
  espaceId: string;

  @Column('numeric', { precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;
}