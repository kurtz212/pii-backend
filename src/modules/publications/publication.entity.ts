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

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  videoUrl: string | null;

  @Column({ default: false })
  isPaused: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}