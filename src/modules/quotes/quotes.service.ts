import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteRequest } from './quote-request.entity';
import { Quote } from './quote.entity';
import { QuoteRequestStatus } from './quote.enums';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { SubmitQuoteDto } from './dto/submit-quote.dto';
import { Espace } from '../espaces/espace.entity';
import { EspaceType } from '../espaces/espace-type.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(QuoteRequest)
    private readonly requestsRepository: Repository<QuoteRequest>,
    @InjectRepository(Quote)
    private readonly quotesRepository: Repository<Quote>,
    @InjectRepository(Espace)
    private readonly espacesRepository: Repository<Espace>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createRequest(clientId: string, dto: CreateQuoteRequestDto): Promise<QuoteRequest> {
    if (dto.targetType !== EspaceType.AGENCE_CARGO && dto.targetType !== EspaceType.TRANSITAIRE) {
      throw new BadRequestException(
        'Seules les agences cargo et les transitaires peuvent recevoir des demandes de devis',
      );
    }

    let targetEspaceIds: string[] | null = null;
    if (dto.targetEspaceIds && dto.targetEspaceIds.length > 0) {
      const espaces = await this.espacesRepository.findByIds(dto.targetEspaceIds);
      if (espaces.length !== dto.targetEspaceIds.length) {
        throw new BadRequestException('Une ou plusieurs agences ciblées sont introuvables');
      }
      const invalidType = espaces.find((e) => e.type !== dto.targetType);
      if (invalidType) {
        throw new BadRequestException('Toutes les agences ciblées doivent être du même type');
      }
      const ownedByClient = espaces.find((e) => e.ownerId === clientId);
      if (ownedByClient) {
        throw new BadRequestException('Tu ne peux pas te cibler toi-même');
      }
      targetEspaceIds = dto.targetEspaceIds;
    }

    const request = this.requestsRepository.create({
      clientId,
      targetType: dto.targetType,
      targetEspaceIds,
      details: dto.details,
      status: QuoteRequestStatus.OPEN,
    });
    const saved = await this.requestsRepository.save(request);

    // Notifie les agences concernées — soit la liste précise, soit
    // toutes les agences du bon type si diffusion large.
    const notifyEspaces = targetEspaceIds
      ? await this.espacesRepository.findByIds(targetEspaceIds)
      : await this.espacesRepository.find({ where: { type: dto.targetType } });
    const ownerIds = [...new Set(notifyEspaces.map((e) => e.ownerId))].filter(
      (id) => id !== clientId,
    );
    for (const ownerId of ownerIds) {
      this.notificationsService.send(
        ownerId,
        'Nouvelle demande de devis',
        targetEspaceIds ? 'Tu as reçu une demande de devis ciblée.' : 'Nouvelle demande de devis ouverte.',
      );
    }

    return saved;
  }

  async findMyRequests(clientId: string): Promise<QuoteRequest[]> {
    return this.requestsRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  // Demandes visibles par une agence : celles qui la ciblent
  // précisément, ou les diffusions larges du bon type.
  async findReceivedRequests(espaceId: string, ownerId: string): Promise<QuoteRequest[]> {
    const espace = await this.espacesRepository.findOne({ where: { id: espaceId } });
    if (!espace || espace.ownerId !== ownerId) {
      throw new ForbiddenException('Cet espace ne t\'appartient pas');
    }

    const all = await this.requestsRepository.find({
      where: { targetType: espace.type },
      order: { createdAt: 'DESC' },
    });

    return all.filter(
      (r) => r.targetEspaceIds === null || r.targetEspaceIds.includes(espaceId),
    );
  }

  async findOne(id: string): Promise<QuoteRequest> {
    const request = await this.requestsRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Demande de devis introuvable');
    }
    return request;
  }

  async findQuotesForRequest(requestId: string): Promise<Quote[]> {
    return this.quotesRepository.find({
      where: { quoteRequestId: requestId },
      relations: ['espace'],
      order: { createdAt: 'ASC' },
    });
  }

  private async assertCanRespond(request: QuoteRequest, espace: Espace): Promise<void> {
    if (espace.type !== request.targetType) {
      throw new ForbiddenException('Cette demande ne concerne pas ce type d\'espace');
    }
    if (request.targetEspaceIds && !request.targetEspaceIds.includes(espace.id)) {
      throw new ForbiddenException('Cette demande ne te cible pas');
    }
  }

  async submitQuote(requestId: string, espaceId: string, ownerId: string, dto: SubmitQuoteDto): Promise<Quote> {
    const request = await this.findOne(requestId);
    if (request.status !== QuoteRequestStatus.OPEN) {
      throw new BadRequestException('Cette demande n\'accepte plus de nouveaux devis');
    }

    const espace = await this.espacesRepository.findOne({ where: { id: espaceId } });
    if (!espace || espace.ownerId !== ownerId) {
      throw new ForbiddenException('Cet espace ne t\'appartient pas');
    }
    await this.assertCanRespond(request, espace);

    const existing = await this.quotesRepository.findOne({
      where: { quoteRequestId: requestId, espaceId },
    });
    if (existing) {
      existing.price = dto.price;
      existing.notes = dto.notes ?? null;
      const saved = await this.quotesRepository.save(existing);
      return saved;
    }

    const quote = this.quotesRepository.create({
      quoteRequestId: requestId,
      espaceId,
      price: dto.price,
      notes: dto.notes ?? null,
    });
    const saved = await this.quotesRepository.save(quote);

    this.notificationsService.send(
      request.clientId,
      'Nouveau devis reçu',
      `${espace.name} a répondu avec un devis de ${Number(dto.price).toLocaleString('fr-FR')} F.`,
    );

    return saved;
  }

  async acceptQuote(requestId: string, quoteId: string, clientId: string): Promise<QuoteRequest> {
    const request = await this.findOne(requestId);
    if (request.clientId !== clientId) {
      throw new ForbiddenException('Cette demande ne t\'appartient pas');
    }
    if (request.status !== QuoteRequestStatus.OPEN) {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    const quote = await this.quotesRepository.findOne({
      where: { id: quoteId, quoteRequestId: requestId },
      relations: ['espace'],
    });
    if (!quote) {
      throw new NotFoundException('Devis introuvable pour cette demande');
    }

    request.status = QuoteRequestStatus.ACCEPTED;
    request.acceptedQuoteId = quoteId;
    const saved = await this.requestsRepository.save(request);

    this.notificationsService.send(
      quote.espace.ownerId,
      'Devis accepté',
      'Ton devis a été accepté par le client.',
    );

    return saved;
  }

  async cancelRequest(requestId: string, clientId: string): Promise<QuoteRequest> {
    const request = await this.findOne(requestId);
    if (request.clientId !== clientId) {
      throw new ForbiddenException('Cette demande ne t\'appartient pas');
    }
    if (request.status !== QuoteRequestStatus.OPEN) {
      throw new BadRequestException('Cette demande ne peut plus être annulée');
    }
    request.status = QuoteRequestStatus.CANCELLED;
    return this.requestsRepository.save(request);
  }

  async completeRequest(requestId: string, ownerId: string): Promise<QuoteRequest> {
    const request = await this.findOne(requestId);
    if (!request.acceptedQuoteId) {
      throw new BadRequestException('Aucun devis accepté pour cette demande');
    }
    const acceptedQuote = await this.quotesRepository.findOne({
      where: { id: request.acceptedQuoteId },
    });
    if (!acceptedQuote || acceptedQuote.espaceId !== ownerId) {
      // ownerId ici est en fait l'id de l'espace appelant — vérifié côté contrôleur
    }
    const espace = await this.espacesRepository.findOne({ where: { id: acceptedQuote?.espaceId } });
    if (!espace || espace.ownerId !== ownerId) {
      throw new ForbiddenException('Cette demande ne t\'est pas destinée');
    }
    request.status = QuoteRequestStatus.COMPLETED;
    return this.requestsRepository.save(request);
  }
}