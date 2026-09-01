import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tontine } from './tontine.entity';
import { TontineParticipant } from './tontine-participant.entity';
import { TontineContribution } from './tontine-contribution.entity';
import { ContributionStatus, TontineStatus } from './tontine.enums';
import { CreateTontineDto } from './dto/create-tontine.dto';

@Injectable()
export class TontinesService {
  constructor(
    @InjectRepository(Tontine)
    private readonly tontinesRepository: Repository<Tontine>,
    @InjectRepository(TontineParticipant)
    private readonly participantsRepository: Repository<TontineParticipant>,
    @InjectRepository(TontineContribution)
    private readonly contributionsRepository: Repository<TontineContribution>,
  ) {}

  async create(userId: string, dto: CreateTontineDto): Promise<Tontine> {
    const tontine = this.tontinesRepository.create({
      creatorId: userId,
      name: dto.name,
      description: dto.description ?? null,
      contributionAmount: dto.contributionAmount,
      maxParticipants: dto.maxParticipants,
      status: TontineStatus.DRAFT,
    });
    const saved = await this.tontinesRepository.save(tontine);

    const membership = this.participantsRepository.create({
      tontineId: saved.id,
      userId,
    });
    await this.participantsRepository.save(membership);

    return saved;
  }

  async findMyTontines(userId: string): Promise<Tontine[]> {
    return this.tontinesRepository
      .createQueryBuilder('tontine')
      .innerJoin(TontineParticipant, 'membership', 'membership.tontineId = tontine.id')
      .where('membership.userId = :userId', { userId })
      .orderBy('tontine.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Tontine> {
    const tontine = await this.tontinesRepository.findOne({ where: { id } });
    if (!tontine) {
      throw new NotFoundException('Tontine introuvable');
    }
    return tontine;
  }

  async findParticipants(tontineId: string): Promise<TontineParticipant[]> {
    return this.participantsRepository.find({
      where: { tontineId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  private async findMembership(
    tontineId: string,
    userId: string,
  ): Promise<TontineParticipant | null> {
    return this.participantsRepository.findOne({ where: { tontineId, userId } });
  }

  async join(tontineId: string, userId: string): Promise<void> {
    const tontine = await this.findOne(tontineId);
    if (tontine.status !== TontineStatus.DRAFT) {
      throw new BadRequestException(
        'Cette tontine a déjà démarré, impossible de la rejoindre maintenant',
      );
    }
    const existing = await this.findMembership(tontineId, userId);
    if (existing) {
      return;
    }
    const currentCount = await this.participantsRepository.count({ where: { tontineId } });
    if (currentCount >= tontine.maxParticipants) {
      throw new BadRequestException(
        'Le nombre maximum de participants fixé par le créateur est atteint',
      );
    }
    const membership = this.participantsRepository.create({ tontineId, userId });
    await this.participantsRepository.save(membership);
  }

  async proposeOrder(tontineId: string, userId: string, proposedOrder: number): Promise<TontineParticipant> {
    const tontine = await this.findOne(tontineId);
    if (tontine.status !== TontineStatus.DRAFT) {
      throw new BadRequestException('Le calendrier de cette tontine est déjà validé');
    }
    const membership = await this.findMembership(tontineId, userId);
    if (!membership) {
      throw new ForbiddenException('Rejoins la tontine avant de proposer un ordre');
    }
    membership.proposedOrder = proposedOrder;
    return this.participantsRepository.save(membership);
  }

  async validateCalendar(
    tontineId: string,
    creatorId: string,
    orderedUserIds: string[],
  ): Promise<Tontine> {
    const tontine = await this.findOne(tontineId);
    if (tontine.creatorId !== creatorId) {
      throw new ForbiddenException('Seul le créateur peut valider le calendrier');
    }
    if (tontine.status !== TontineStatus.DRAFT) {
      throw new BadRequestException('Cette tontine a déjà été validée');
    }

    const participants = await this.findParticipants(tontineId);
    const participantIds = new Set(participants.map((p) => p.userId));

    if (participants.length !== tontine.maxParticipants) {
      throw new BadRequestException(
        `Il manque des participants : ${participants.length}/${tontine.maxParticipants} inscrits`,
      );
    }

    if (orderedUserIds.length !== participants.length) {
      throw new BadRequestException(
        'La liste doit contenir exactement tous les participants, chacun une seule fois',
      );
    }
    const seen = new Set<string>();
    for (const uid of orderedUserIds) {
      if (!participantIds.has(uid) || seen.has(uid)) {
        throw new BadRequestException('Liste de participants invalide');
      }
      seen.add(uid);
    }

    for (let i = 0; i < orderedUserIds.length; i++) {
      await this.participantsRepository.update(
        { tontineId, userId: orderedUserIds[i] },
        { confirmedOrder: i + 1 },
      );
    }

    const roundsCount = orderedUserIds.length;
    const contributions: TontineContribution[] = [];
    for (let round = 1; round <= roundsCount; round++) {
      for (const uid of orderedUserIds) {
        contributions.push(
          this.contributionsRepository.create({
            tontineId,
            roundNumber: round,
            participantId: uid,
            status: ContributionStatus.PENDING,
          }),
        );
      }
    }
    await this.contributionsRepository.save(contributions);

    tontine.status = TontineStatus.ACTIVE;
    return this.tontinesRepository.save(tontine);
  }

  async findContributions(tontineId: string, round?: number): Promise<TontineContribution[]> {
    const query = this.contributionsRepository
      .createQueryBuilder('contribution')
      .leftJoinAndSelect('contribution.participant', 'participant')
      .where('contribution.tontineId = :tontineId', { tontineId })
      .orderBy('contribution.roundNumber', 'ASC');

    if (round) {
      query.andWhere('contribution.roundNumber = :round', { round });
    }

    return query.getMany();
  }

  async updateContribution(
    tontineId: string,
    contributionId: string,
    creatorId: string,
    status: ContributionStatus,
  ): Promise<TontineContribution> {
    const tontine = await this.findOne(tontineId);
    if (tontine.creatorId !== creatorId) {
      throw new ForbiddenException('Seul le créateur peut mettre à jour les cotisations');
    }
    const contribution = await this.contributionsRepository.findOne({
      where: { id: contributionId, tontineId },
    });
    if (!contribution) {
      throw new NotFoundException('Cotisation introuvable');
    }
    contribution.status = status;
    return this.contributionsRepository.save(contribution);
  }
}