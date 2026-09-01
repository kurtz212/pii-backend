import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Espace } from '../espaces/espace.entity';
import { CreateUserDto } from './dto/create-user.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Espace)
    private readonly espacesRepository: Repository<Espace>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec ce numéro de téléphone');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const affiliationCode = await this.generateUniqueAffiliationCode(dto.fullName);

    const user = this.usersRepository.create({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email ?? null,
      passwordHash,
      affiliationCode,
    });

    return this.usersRepository.save(user);
  }

  private async generateUniqueAffiliationCode(fullName: string): Promise<string> {
    const base = fullName
      .trim()
      .split(/\s+/)[0]
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z]/g, '')
      .slice(0, 10) || 'PII';

    for (let attempt = 0; attempt < 10; attempt++) {
      const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      const code = `${base}-${suffix}`;
      const existing = await this.usersRepository.findOne({ where: { affiliationCode: code } });
      if (!existing) {
        return code;
      }
    }
    return `${base}-${Date.now().toString(36).toUpperCase()}`;
  }

  async findByPhoneWithPassword(phone: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.phone = :phone', { phone })
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findByAffiliationCode(code: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { affiliationCode: code } });
  }

  async updateMobileMoney(
    userId: string,
    operator: string,
    number: string,
  ): Promise<User> {
    await this.usersRepository.update(
      { id: userId },
      { mobileMoneyOperator: operator, mobileMoneyNumber: number },
    );
    const updated = await this.findById(userId);
    return updated!;
  }

  async lockReferral(userId: string, code: string): Promise<void> {
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ referredByCode: code })
      .where('id = :userId', { userId })
      .andWhere('"referredByCode" IS NULL')
      .execute();
  }

  async submitKyc(userId: string, idDocumentType: string, idDocumentNumber: string): Promise<User> {
    await this.usersRepository.update(
      { id: userId },
      { idDocumentType, idDocumentNumber, kycStatus: 'submitted' },
    );
    const updated = await this.findById(userId);
    return updated!;
  }

  async search(query: string, excludeUserId: string): Promise<User[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [];
    }
    const pattern = `%${trimmed}%`;

    const byNameOrPhone = await this.usersRepository
      .createQueryBuilder('user')
      .where('(user.fullName ILIKE :pattern OR user.phone ILIKE :pattern)', { pattern })
      .andWhere('user.id != :excludeUserId', { excludeUserId })
      .limit(20)
      .getMany();

    const matchingEspaces = await this.espacesRepository
      .createQueryBuilder('espace')
      .where('espace.name ILIKE :pattern', { pattern })
      .andWhere('espace.ownerId != :excludeUserId', { excludeUserId })
      .limit(20)
      .getMany();

    const ownerIds = [...new Set(matchingEspaces.map((e) => e.ownerId))];
    const owners = ownerIds.length
      ? await this.usersRepository.find({ where: ownerIds.map((id) => ({ id })) })
      : [];

    const merged = new Map<string, User>();
    for (const u of [...byNameOrPhone, ...owners]) {
      merged.set(u.id, u);
    }
    return Array.from(merged.values()).slice(0, 20);
  }
  async updateLanguagePreferences(
    userId: string,
    preferredTextLanguage?: string,
    preferredAudioLanguage?: string,
  ): Promise<User> {
    const update: Partial<User> = {};
    if (preferredTextLanguage !== undefined) update.preferredTextLanguage = preferredTextLanguage;
    if (preferredAudioLanguage !== undefined) update.preferredAudioLanguage = preferredAudioLanguage;
    await this.usersRepository.update({ id: userId }, update);
    const updated = await this.findById(userId);
    return updated!;
  }
  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    await this.usersRepository.update({ id: userId }, { pushToken });
  }
}