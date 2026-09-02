import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryRequest } from './delivery-request.entity';
import { DeliveryOffer } from './delivery-offer.entity';
import { DeliveryReview } from './delivery-review.entity';
import { DeliveryAgencyMember } from './delivery-agency-member.entity';
import { DeliveryOfferStatus, DeliveryRequestStatus } from './delivery.enums';
import { CreateDeliveryRequestDto } from './dto/create-delivery-request.dto';
import { CreateDeliveryOfferDto } from './dto/create-delivery-offer.dto';
import { CreateDeliveryReviewDto } from './dto/create-delivery-review.dto';
import { Espace } from '../espaces/espace.entity';
import { EspaceType } from '../espaces/espace-type.enum';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface DeliveryBadgeInfo {
  completedDeliveries: number;
  averageRating: number | null;
  reviewCount: number;
}

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(DeliveryRequest)
    private readonly requestsRepository: Repository<DeliveryRequest>,
    @InjectRepository(DeliveryOffer)
    private readonly offersRepository: Repository<DeliveryOffer>,
    @InjectRepository(DeliveryReview)
    private readonly reviewsRepository: Repository<DeliveryReview>,
    @InjectRepository(DeliveryAgencyMember)
    private readonly agencyMembersRepository: Repository<DeliveryAgencyMember>,
    @InjectRepository(Espace)
    private readonly espacesRepository: Repository<Espace>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createRequest(
    clientId: string,
    dto: CreateDeliveryRequestDto,
  ): Promise<DeliveryRequest> {
    const request = this.requestsRepository.create({
      clientId,
      depart: dto.depart,
      destination: dto.destination,
      notes: dto.notes ?? null,
      packageSize: dto.packageSize ?? null,
      isFragile: dto.isFragile ?? false,
      status: DeliveryRequestStatus.OPEN,
    });
    const saved = await this.requestsRepository.save(request);

    const agencies = await this.espacesRepository.find({
      where: { type: EspaceType.AGENCE_LIVRAISON },
    });
    const ownerIds = [...new Set(agencies.map((a) => a.ownerId))].filter(
      (id) => id !== clientId,
    );
    for (const ownerId of ownerIds) {
      this.notificationsService.send(
        ownerId,
        'Nouvelle demande de livraison',
        `${dto.depart} vers ${dto.destination}`,
      );
    }

    return saved;
  }

  async findOpenRequests(excludeClientId?: string): Promise<DeliveryRequest[]> {
    const query = this.requestsRepository
      .createQueryBuilder('request')
      .where('request.status = :status', { status: DeliveryRequestStatus.OPEN })
      .orderBy('request.createdAt', 'DESC');

    if (excludeClientId) {
      query.andWhere('request.clientId != :excludeClientId', { excludeClientId });
    }

    return query.getMany();
  }

  async findMyRequests(clientId: string): Promise<DeliveryRequest[]> {
    return this.requestsRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAcceptedByProvider(providerId: string): Promise<DeliveryRequest[]> {
    return this.requestsRepository
      .createQueryBuilder('request')
      .leftJoin(DeliveryOffer, 'offer', 'offer.deliveryRequestId = request.id')
      .where('request.assignedLivreurId = :providerId', { providerId })
      .orWhere(
        '(offer.providerId = :providerId AND offer.status = :accepted AND offer.espaceId IS NULL AND request.acceptedOfferId = offer.id)',
        { providerId, accepted: DeliveryOfferStatus.ACCEPTED },
      )
      .orderBy('request.createdAt', 'DESC')
      .getMany();
  }

  async findRequestById(id: string): Promise<DeliveryRequest> {
    const request = await this.requestsRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Demande de livraison introuvable');
    }
    return request;
  }

  async createOffer(
    requestId: string,
    providerId: string,
    dto: CreateDeliveryOfferDto,
  ): Promise<DeliveryOffer> {
    const request = await this.findRequestById(requestId);

    if (request.status !== DeliveryRequestStatus.OPEN) {
      throw new BadRequestException('Cette demande n\'accepte plus de nouvelles offres');
    }
    if (request.clientId === providerId) {
      throw new ForbiddenException('Tu ne peux pas proposer une offre sur ta propre demande');
    }

    let espaceId: string | null = null;
    if (dto.espaceId) {
      const espace = await this.espacesRepository.findOne({ where: { id: dto.espaceId } });
      if (!espace) {
        throw new NotFoundException('Espace introuvable');
      }
      if (espace.ownerId !== providerId) {
        throw new ForbiddenException('Cet espace ne t\'appartient pas');
      }
      if (espace.type !== EspaceType.AGENCE_LIVRAISON) {
        throw new BadRequestException('Seule une agence de livraison peut proposer une offre en son nom');
      }
      espaceId = espace.id;
    }

    const offer = this.offersRepository.create({
      deliveryRequestId: requestId,
      providerId,
      price: dto.price,
      espaceId,
      status: DeliveryOfferStatus.PENDING,
    });
    const saved = await this.offersRepository.save(offer);

    this.notificationsService.send(
      request.clientId,
      'Nouvelle offre de livraison',
      `Une offre de ${Number(dto.price).toLocaleString('fr-FR')} F a ete proposee pour ta livraison.`,
    );

    return saved;
  }

  async findOffersForRequest(requestId: string): Promise<DeliveryOffer[]> {
    return this.offersRepository.find({
      where: { deliveryRequestId: requestId },
      order: { price: 'ASC' },
    });
  }

  async acceptOffer(
    requestId: string,
    offerId: string,
    clientId: string,
  ): Promise<DeliveryRequest> {
    const request = await this.findRequestById(requestId);

    if (request.clientId !== clientId) {
      throw new ForbiddenException('Cette demande ne t\'appartient pas');
    }
    if (request.status !== DeliveryRequestStatus.OPEN) {
      throw new BadRequestException('Cette demande a deja ete traitee');
    }

    const offer = await this.offersRepository.findOne({
      where: { id: offerId, deliveryRequestId: requestId },
    });
    if (!offer) {
      throw new NotFoundException('Offre introuvable pour cette demande');
    }

    await this.offersRepository.update(
      { deliveryRequestId: requestId },
      { status: DeliveryOfferStatus.REJECTED },
    );
    await this.offersRepository.update(
      { id: offerId },
      { status: DeliveryOfferStatus.ACCEPTED },
    );

    request.status = DeliveryRequestStatus.ASSIGNED;
    request.acceptedOfferId = offerId;
    const saved = await this.requestsRepository.save(request);

    this.notificationsService.send(
      offer.providerId,
      'Offre acceptee',
      'Ton offre de livraison a ete acceptee !',
    );

    return saved;
  }

  async assignToLivreur(
    requestId: string,
    agencyOwnerId: string,
    livreurId: string,
  ): Promise<DeliveryRequest> {
    const request = await this.findRequestById(requestId);
    if (!request.acceptedOfferId) {
      throw new BadRequestException('Aucune offre acceptee pour cette demande');
    }
    const offer = await this.offersRepository.findOne({
      where: { id: request.acceptedOfferId },
    });
    if (!offer || !offer.espaceId) {
      throw new BadRequestException('Cette livraison n\'a pas ete proposee par une agence');
    }
    const espace = await this.espacesRepository.findOne({ where: { id: offer.espaceId } });
    if (!espace || espace.ownerId !== agencyOwnerId) {
      throw new ForbiddenException('Cette livraison ne peut pas etre attribuee par toi');
    }

    const membership = await this.agencyMembersRepository.findOne({
      where: { espaceId: espace.id, livreurId, status: 'accepted' },
    });
    if (!membership) {
      throw new BadRequestException('Ce livreur ne fait pas partie de ton equipe');
    }

    request.assignedLivreurId = livreurId;
    return this.requestsRepository.save(request);
  }

  async inviteLivreur(
    espaceId: string,
    agencyOwnerId: string,
    phone: string,
  ): Promise<DeliveryAgencyMember> {
    const espace = await this.espacesRepository.findOne({ where: { id: espaceId } });
    if (!espace) {
      throw new NotFoundException('Agence introuvable');
    }
    if (espace.ownerId !== agencyOwnerId) {
      throw new ForbiddenException('Cette agence ne t\'appartient pas');
    }
    if (espace.type !== EspaceType.AGENCE_LIVRAISON) {
      throw new BadRequestException('Cet espace n\'est pas une agence de livraison');
    }

    const livreur = await this.usersService.findByPhone(phone);
    if (!livreur) {
      throw new NotFoundException('Aucun utilisateur inscrit avec ce numero');
    }
    if (livreur.id === agencyOwnerId) {
      throw new BadRequestException('Tu ne peux pas t\'inviter toi-meme');
    }

    const existing = await this.agencyMembersRepository.findOne({
      where: { espaceId, livreurId: livreur.id },
    });
    if (existing) {
      throw new BadRequestException(
        existing.status === 'accepted'
          ? 'Ce livreur fait deja partie de ton equipe'
          : 'Une invitation est deja en attente pour ce livreur',
      );
    }

    const membership = this.agencyMembersRepository.create({
      espaceId,
      livreurId: livreur.id,
      status: 'pending',
    });
    const saved = await this.agencyMembersRepository.save(membership);

    this.notificationsService.send(
      livreur.id,
      'Invitation a rejoindre une equipe',
      `${espace.name} t'invite a rejoindre son equipe de livreurs.`,
    );

    return saved;
  }

  async findMyInvites(livreurId: string): Promise<DeliveryAgencyMember[]> {
    return this.agencyMembersRepository.find({
      where: { livreurId, status: 'pending' },
      relations: ['espace'],
      order: { joinedAt: 'DESC' },
    });
  }

  async respondToInvite(
    membershipId: string,
    livreurId: string,
    accept: boolean,
  ): Promise<{ accepted: boolean }> {
    const membership = await this.agencyMembersRepository.findOne({
      where: { id: membershipId },
    });
    if (!membership) {
      throw new NotFoundException('Invitation introuvable');
    }
    if (membership.livreurId !== livreurId) {
      throw new ForbiddenException('Cette invitation ne t\'est pas destinee');
    }
    if (membership.status !== 'pending') {
      throw new BadRequestException('Cette invitation a deja ete traitee');
    }

    if (accept) {
      membership.status = 'accepted';
      await this.agencyMembersRepository.save(membership);
      return { accepted: true };
    }
    await this.agencyMembersRepository.remove(membership);
    return { accepted: false };
  }

  async findAgencyTeam(espaceId: string): Promise<DeliveryAgencyMember[]> {
    return this.agencyMembersRepository.find({
      where: { espaceId },
      relations: ['livreur'],
      order: { joinedAt: 'ASC' },
    });
  }

  async findAgencyAssignments(espaceId: string, agencyOwnerId: string): Promise<DeliveryRequest[]> {
    const espace = await this.espacesRepository.findOne({ where: { id: espaceId } });
    if (!espace || espace.ownerId !== agencyOwnerId) {
      throw new ForbiddenException('Cette agence ne t\'appartient pas');
    }

    return this.requestsRepository
      .createQueryBuilder('request')
      .innerJoin(DeliveryOffer, 'offer', 'offer.id = request.acceptedOfferId')
      .where('offer.espaceId = :espaceId', { espaceId })
      .orderBy('request.createdAt', 'DESC')
      .getMany();
  }

  async markAsCompleted(requestId: string, clientId: string): Promise<DeliveryRequest> {
    const request = await this.findRequestById(requestId);
    if (request.clientId !== clientId) {
      throw new ForbiddenException('Cette demande ne t\'appartient pas');
    }
    if (request.status !== DeliveryRequestStatus.ASSIGNED) {
      throw new BadRequestException('Cette livraison ne peut pas encore etre marquee comme recue');
    }
    request.status = DeliveryRequestStatus.COMPLETED;
    return this.requestsRepository.save(request);
  }

  async createReview(clientId: string, dto: CreateDeliveryReviewDto): Promise<DeliveryReview> {
    const request = await this.findRequestById(dto.deliveryRequestId);
    if (request.clientId !== clientId) {
      throw new ForbiddenException('Cette demande ne t\'appartient pas');
    }
    if (request.status !== DeliveryRequestStatus.COMPLETED) {
      throw new BadRequestException(
        'Tu ne peux noter le livreur qu\'une fois le colis marque comme recu',
      );
    }
    if (!request.acceptedOfferId) {
      throw new BadRequestException('Aucune offre acceptee pour cette demande');
    }

    const existing = await this.reviewsRepository.findOne({
      where: { deliveryRequestId: dto.deliveryRequestId },
    });
    if (existing) {
      throw new BadRequestException('Un avis existe deja pour cette livraison');
    }

    const offer = await this.offersRepository.findOne({
      where: { id: request.acceptedOfferId },
    });
    if (!offer) {
      throw new NotFoundException('Offre acceptee introuvable');
    }

    const providerId = request.assignedLivreurId ?? offer.providerId;

    const review = this.reviewsRepository.create({
      deliveryRequestId: dto.deliveryRequestId,
      clientId,
      providerId,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });
    return this.reviewsRepository.save(review);
  }

  async getProviderBadgeInfo(providerId: string): Promise<DeliveryBadgeInfo> {
    const completedDeliveries = await this.requestsRepository
      .createQueryBuilder('request')
      .leftJoin(DeliveryOffer, 'offer', 'offer.id = request.acceptedOfferId')
      .where('request.status = :completed', { completed: DeliveryRequestStatus.COMPLETED })
      .andWhere(
        '(request.assignedLivreurId = :providerId OR (offer.providerId = :providerId AND offer.espaceId IS NULL))',
        { providerId },
      )
      .getCount();

    const reviews = await this.reviewsRepository.find({ where: { providerId } });
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
        : null;

    return { completedDeliveries, averageRating, reviewCount };
  }

  async getContactInfo(
    requestId: string,
    requesterId: string,
  ): Promise<{ name: string; phone: string; role: 'client' | 'provider' }> {
    const request = await this.findRequestById(requestId);
    if (
      request.status !== DeliveryRequestStatus.ASSIGNED &&
      request.status !== DeliveryRequestStatus.COMPLETED
    ) {
      throw new BadRequestException('Aucun contact disponible pour cette livraison');
    }
    if (!request.acceptedOfferId) {
      throw new BadRequestException('Aucune offre acceptee pour cette livraison');
    }
    const offer = await this.offersRepository.findOne({
      where: { id: request.acceptedOfferId },
    });
    if (!offer) {
      throw new NotFoundException('Offre acceptee introuvable');
    }
    const providerId = request.assignedLivreurId ?? offer.providerId;

    if (requesterId === request.clientId) {
      const provider = await this.usersService.findById(providerId);
      if (!provider) {
        throw new NotFoundException('Livreur introuvable');
      }
      return { name: provider.fullName, phone: provider.phone, role: 'provider' };
    }
    if (requesterId === providerId) {
      const client = await this.usersService.findById(request.clientId);
      if (!client) {
        throw new NotFoundException('Client introuvable');
      }
      return { name: client.fullName, phone: client.phone, role: 'client' };
    }
    throw new ForbiddenException('Tu n\'es pas concerne par cette livraison');
  }
}
