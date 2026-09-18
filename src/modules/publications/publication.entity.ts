import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Espace } from '../espaces/espace.entity';
import { PublicationContentType } from './publication-content-type.enum';

@Entity('publications')
export class Publication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Espace, { onDelete: 'CASCADE' })
  espace: Espace;

  @Index()
  @Column()
  espaceId: string;

  @Column({
    type: 'enum',
    enum: PublicationContentType,
    default: PublicationContentType.IMAGE,
  })
  contentType: PublicationContentType;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('numeric', { precision: 12, scale: 2, nullable: true })
  price: number | null;

  @Column({ default: false })
  tranchesActivees: boolean;

  @Column({ default: false })
  presenterEnLive: boolean;

   // Conservé pour compatibilité avec les publications déjà créées
  // avant le support multi-photos — représente la première image.
  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string | null;

  // Tableau complet des photos du carrousel (inclut la première,
  // dupliquée avec imageUrl). Vide/null pour les anciennes
  // publications à une seule image ou pour les vidéos.
  @Column({ type: 'jsonb', nullable: true })
  imageUrls: string[] | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  videoUrl: string | null;

  @Column({ default: false })
  isPaused: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}