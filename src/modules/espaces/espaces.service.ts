import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Espace } from './espace.entity';
import { CreateEspaceDto } from './dto/create-espace.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class EspacesService {
  constructor(
    @InjectRepository(Espace)
    private readonly espacesRepository: Repository<Espace>,
    private readonly usersService: UsersService,
  ) {}

  async create(ownerId: string, dto: CreateEspaceDto): Promise<Espace> {
    const owner = await this.usersService.findById(ownerId);
    if (!owner) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const codeSaisi = dto.affiliationCode.trim().toUpperCase();
    const propreCode = owner.affiliationCode;

    if (owner.referredByCode) {
      if (codeSaisi !== propreCode) {
        throw new BadRequestException(
          'Le champ code d\'affiliation est verrouillé sur ton propre code pour cette création.',
        );
      }
    } else if (codeSaisi !== propreCode) {
      const parrain = await this.usersService.findByAffiliationCode(codeSaisi);
      if (!parrain) {
        throw new BadRequestException('Code d\'affiliation invalide');
      }
      if (parrain.id === ownerId) {
        throw new BadRequestException('Tu ne peux pas utiliser ton propre code');
      }
      await this.usersService.lockReferral(ownerId, codeSaisi);
    }

    const espace = this.espacesRepository.create({
      ownerId,
      type: dto.type,
      name: dto.name,
      description: dto.description ?? null,
      location: dto.location ?? null,
      details: dto.details ?? {},
      affiliationCodeUsed: codeSaisi,
      subscriptionActive: false,
    });

    return this.espacesRepository.save(espace);
  }

  async findAllByOwner(ownerId: string): Promise<Espace[]> {
    return this.espacesRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findPublic(type?: string, category?: string): Promise<Espace[]> {
    const query = this.espacesRepository
      .createQueryBuilder('espace')
      .orderBy('espace.createdAt', 'DESC');

    if (type) {
      query.andWhere('espace.type = :type', { type });
    }
    if (category) {
      query.andWhere("espace.details->>'category' = :category", { category });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Espace> {
    const espace = await this.espacesRepository.findOne({ where: { id } });
    if (!espace) {
      throw new NotFoundException('Espace introuvable');
    }
    return espace;
  }

  async findOwnedEspace(id: string, ownerId: string): Promise<Espace> {
    const espace = await this.findOne(id);
    if (espace.ownerId !== ownerId) {
      throw new ForbiddenException('Cet espace ne vous appartient pas');
    }
    return espace;
  }

  async update(
    id: string,
    ownerId: string,
    dto: { description?: string; location?: string; details?: Record<string, unknown> },
  ): Promise<Espace> {
    const espace = await this.findOwnedEspace(id, ownerId);

    if (dto.description !== undefined) espace.description = dto.description;
    if (dto.location !== undefined) espace.location = dto.location;
    if (dto.details) espace.details = { ...espace.details, ...dto.details };

    return this.espacesRepository.save(espace);
  }
}
