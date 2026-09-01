import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { OrderStatus } from '../orders/order.enums';
import { Review } from '../reviews/review.entity';

export type BadgeLevel = 'bronze' | 'argent' | 'or' | null;

export interface BadgeInfo {
  completedOrders: number;
  averageRating: number | null;
  reviewCount: number;
  level: BadgeLevel;
}

const BRONZE_MIN_ORDERS = 3;
const ARGENT_MIN_ORDERS = 15;
const ARGENT_MIN_RATING = 4.0;
const OR_MIN_ORDERS = 40;
const OR_MIN_RATING = 4.5;

@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
  ) {}

  async getBadgeInfo(espaceId: string): Promise<BadgeInfo> {
    const completedOrders = await this.ordersRepository.count({
      where: { espaceId, status: OrderStatus.DELIVERED },
    });

    const reviews = await this.reviewsRepository.find({ where: { espaceId } });
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
        : null;

    let level: BadgeLevel = null;
    if (
      completedOrders >= OR_MIN_ORDERS &&
      averageRating !== null &&
      averageRating >= OR_MIN_RATING
    ) {
      level = 'or';
    } else if (
      completedOrders >= ARGENT_MIN_ORDERS &&
      averageRating !== null &&
      averageRating >= ARGENT_MIN_RATING
    ) {
      level = 'argent';
    } else if (completedOrders >= BRONZE_MIN_ORDERS) {
      level = 'bronze';
    }

    return { completedOrders, averageRating, reviewCount, level };
  }
}