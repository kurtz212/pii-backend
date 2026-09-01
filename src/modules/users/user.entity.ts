import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  fullName: string;

  @Column({ unique: true, length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ select: false })
  passwordHash: string;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  affiliationCode: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  referredByCode: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  mobileMoneyOperator: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobileMoneyNumber: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  idDocumentType: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  idDocumentNumber: string | null;

  @Column({ type: 'varchar', length: 20, default: 'none' })
  kycStatus: 'none' | 'submitted' | 'verified';

  @Column({ type: 'varchar', length: 5, default: 'fr' })
  preferredTextLanguage: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  preferredAudioLanguage: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pushToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}