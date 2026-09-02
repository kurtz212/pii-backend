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
               articleName: dto.articleName ?? null,
        articlePrice: dto.articlePrice ?? null,
        articleImageUrl: dto.articleImageUrl ?? null,
        confidentialityPolicy: dto.confidentialityPolicy ?? null,
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

    // Le créateur propose (ou re-propose après ajustement) un
  // calendrier complet — un ordre pour chaque participant inscrit.
  // Réinitialise la réponse de tout le monde à "pending" à chaque
  // nouvelle proposition, puisque c'est un nouveau tour.
  async proposeCalendar(
    tontineId: string,
    creatorId: string,
    assignments: { userId: string; order: number }[],
  ): Promise<TontineParticipant[]> {
    const tontine = await this.findOne(tontineId);
    if (tontine.creatorId !== creatorId) {
      throw new ForbiddenException('Seul le créateur peut proposer le calendrier');
    }
    if (tontine.status !== TontineStatus.DRAFT) {
      throw new BadRequestException('Cette tontine a déjà démarré');
    }

    const participants = await this.findParticipants(tontineId);
    if (participants.length !== tontine.maxParticipants) {
      throw new BadRequestException(
        `Il manque des participants : ${participants.length}/${tontine.maxParticipants} inscrits`,
      );
    }
    const participantIds = new Set(participants.map((p) => p.userId));

    if (assignments.length !== participants.length) {
      throw new BadRequestException(
        'La proposition doit couvrir exactement tous les participants, chacun une seule fois',
      );
    }
    const seenUsers = new Set<string>();
    const seenOrders = new Set<number>();
    for (const a of assignments) {
      if (!participantIds.has(a.userId) || seenUsers.has(a.userId)) {
        throw new BadRequestException('Liste de participants invalide');
      }
      if (a.order < 1 || a.order > participants.length || seenOrders.has(a.order)) {
        throw new BadRequestException('Les positions doivent être uniques, de 1 à N');
      }
      seenUsers.add(a.userId);
      seenOrders.add(a.order);
    }

    for (const a of assignments) {
      await this.participantsRepository.update(
        { tontineId, userId: a.userId },
        { proposedOrder: a.order, requestedOrder: null, responseStatus: 'pending' },
      );
    }

    return this.findParticipants(tontineId);
  }

  // Un participant répond à la proposition en cours : soit il
  // valide l'ordre proposé, soit il demande un autre ordre.
  async respondToProposal(
    tontineId: string,
    userId: string,
    accept: boolean,
    requestedOrder?: number,
  ): Promise<TontineParticipant> {
    const tontine = await this.findOne(tontineId);
    if (tontine.status !== TontineStatus.DRAFT) {
      throw new BadRequestException('Le calendrier de cette tontine est déjà validé');
    }
    const membership = await this.findMembership(tontineId, userId);
    if (!membership) {
      throw new ForbiddenException('Tu ne fais pas partie de cette tontine');
    }
    if (membership.proposedOrder === null) {
      throw new BadRequestException('Aucune proposition en cours pour cette tontine');
    }

    if (accept) {
      membership.responseStatus = 'validated';
      membership.requestedOrder = null;
    } else {
      if (!requestedOrder) {
        throw new BadRequestException('Précise l\'ordre que tu souhaites à la place');
      }
      membership.responseStatus = 'amended';
      membership.requestedOrder = requestedOrder;
    }

    return this.participantsRepository.save(membership);
  }

  // Le créateur clôture la négociation : le dernier proposedOrder de
  // chaque participant devient définitif (confirmedOrder), les
  // cotisations sont générées, la tontine démarre.
  async finalizeCalendar(tontineId: string, creatorId: string): Promise<Tontine> {
    const tontine = await this.findOne(tontineId);
    if (tontine.creatorId !== creatorId) {
      throw new ForbiddenException('Seul le créateur peut finaliser le calendrier');
    }
    if (tontine.status !== TontineStatus.DRAFT) {
      throw new BadRequestException('Cette tontine a déjà été validée');
    }

    const participants = await this.findParticipants(tontineId);
    if (participants.length !== tontine.maxParticipants) {
      throw new BadRequestException(
        `Il manque des participants : ${participants.length}/${tontine.maxParticipants} inscrits`,
      );
    }
    const missing = participants.find((p) => p.proposedOrder === null);
    if (missing) {
      throw new BadRequestException(
        'Propose un calendrier complet avant de le finaliser',
      );
    }

    for (const p of participants) {
      await this.participantsRepository.update(
        { tontineId, userId: p.userId },
        { confirmedOrder: p.proposedOrder },
      );
    }

    const roundsCount = participants.length;
    const contributions: TontineContribution[] = [];
    for (let round = 1; round <= roundsCount; round++) {
      for (const p of participants) {
        contributions.push(
          this.contributionsRepository.create({
            tontineId,
            roundNumber: round,
            participantId: p.userId,
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