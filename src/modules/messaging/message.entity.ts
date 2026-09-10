import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Conversation } from './conversation.entity';
import { MessageType } from './message-type.enum';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @Index()
  @Column()
  conversationId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @Index()
  @Column()
  senderId: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  // Pour un message texte : le texte lui-même.
  // Pour les autres types : content contient une légende optionnelle
  // (ou vide), et metadata contient les vraies données :
  //   image/video/file -> { url, fileName?, fileSize? }
  //   location -> { latitude, longitude, label? }
  //   contact -> { name, phone }
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}