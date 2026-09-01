import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Espace } from '../espaces/espace.entity';
import { GroupType } from './group.enums';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Espace, { onDelete: 'CASCADE' })
  espace: Espace;

  @Index()
  @Column()
  espaceId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  creator: User;

  @Index()
  @Column()
  creatorId: string;

  @Column({ type: 'enum', enum: GroupType })
  type: GroupType;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;
}