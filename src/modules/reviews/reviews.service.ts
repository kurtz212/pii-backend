import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { Order } from '../orders/order.entity';
import { OrderStatus } from '../orders/order.enums';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  async create(authorId: string, dto: CreateReviewDto): Promise<Review> {
    const order = await this.ordersRepository.findOne({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
    if (order.clientId !== authorId) {
      throw new ForbiddenException('Cette commande ne t\'appartient pas');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Tu ne peux laisser un avis qu\'une fois la commande livrée');
    }

    const existing = await this.reviewsRepository.findOne({ where: { orderId: dto.orderId } });
    if (existing) {
      throw new BadRequestException('Un avis existe déjà pour cette commande');
    }

    const review = this.reviewsRepository.create({
      espaceId: order.espaceId,
      authorId,
      orderId: dto.orderId,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });

    return this.reviewsRepository.save(review);
  }

  async findByEspace(espaceId: string): Promise<Review[]> {
    return this.reviewsRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.author', 'author')
      .where('review.espaceId = :espaceId', { espaceId })
      .orderBy('review.createdAt', 'DESC')
      .getMany();
  }
}