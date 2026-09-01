import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { Publication } from '../publications/publication.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentMethod } from './order.enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Publication)
    private readonly publicationsRepository: Repository<Publication>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(clientId: string, dto: CreateOrderDto): Promise<Order> {
    const publication = await this.publicationsRepository.findOne({
      where: { id: dto.publicationId },
      relations: ['espace'],
    });
    if (!publication) {
      throw new NotFoundException('Publication introuvable');
    }

    if (publication.espace.ownerId === clientId) {
      throw new BadRequestException('Tu ne peux pas commander ton propre article');
    }

    if (publication.price === null) {
      throw new BadRequestException('Cette publication n\'est pas à vendre');
    }

    if (dto.paymentMethod === PaymentMethod.TRANCHES && !publication.tranchesActivees) {
      throw new BadRequestException(
        'Le paiement par tranches n\'est pas activé pour cet article',
      );
    }

    const order = this.ordersRepository.create({
      clientId,
      publicationId: publication.id,
      espaceId: publication.espaceId,
      sellerId: publication.espace.ownerId,
      title: publication.title,
      price: publication.price,
      paymentMethod: dto.paymentMethod,
      receptionMode: dto.receptionMode,
      notes: dto.notes ?? null,
      status: OrderStatus.PENDING,
    });

    const saved = await this.ordersRepository.save(order);

    this.notificationsService.send(
      saved.sellerId,
      'Nouvelle commande',
      `Nouvelle commande pour "${saved.title}"`,
    );

    return saved;
  }

  async findMyOrders(clientId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findReceivedOrders(sellerId: string, espaceId?: string): Promise<Order[]> {
    const query = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.sellerId = :sellerId', { sellerId })
      .orderBy('order.createdAt', 'DESC');

    if (espaceId) {
      query.andWhere('order.espaceId = :espaceId', { espaceId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
    return order;
  }

  async updateStatus(id: string, sellerId: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    if (order.sellerId !== sellerId) {
      throw new ForbiddenException('Cette commande ne t\'appartient pas');
    }
    order.status = status;
    const saved = await this.ordersRepository.save(order);

    const statusLabels: Record<string, string> = {
      confirmed: 'confirmée',
      delivered: 'livrée',
      cancelled: 'annulée',
    };
    const label = statusLabels[status] ?? status;
    this.notificationsService.send(
      saved.clientId,
      'Commande mise à jour',
      `Ta commande "${saved.title}" est maintenant ${label}.`,
    );

    return saved;
  }
}