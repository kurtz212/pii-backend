import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryRequestDto } from './dto/create-delivery-request.dto';
import { CreateDeliveryOfferDto } from './dto/create-delivery-offer.dto';
import { CreateDeliveryReviewDto } from './dto/create-delivery-review.dto';
import { AssignLivreurDto } from './dto/assign-livreur.dto';

interface AuthenticatedUser {
  userId: string;
  phone: string;
}

@Controller('delivery-requests')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDeliveryRequestDto,
  ) {
    return this.deliveryService.createRequest(user.userId, dto);
  }

  @Get('open')
  async findOpen(
    @CurrentUser() user: AuthenticatedUser,
    @Query('excludeMine') excludeMine?: string,
  ) {
    return this.deliveryService.findOpenRequests(
      excludeMine === 'true' ? user.userId : undefined,
    );
  }

  @Get('mine')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.findMyRequests(user.userId);
  }

  @Get('accepted-mine')
  async findAcceptedByMe(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.findAcceptedByProvider(user.userId);
  }

  @Get('provider/:providerId/badge')
  async getProviderBadge(@Param('providerId') providerId: string) {
    return this.deliveryService.getProviderBadgeInfo(providerId);
  }

  @Post('reviews')
  async createReview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDeliveryReviewDto,
  ) {
    return this.deliveryService.createReview(user.userId, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.deliveryService.findRequestById(id);
  }

  @Post(':id/offers')
  async createOffer(
    @Param('id') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDeliveryOfferDto,
  ) {
    return this.deliveryService.createOffer(requestId, user.userId, dto);
  }

  @Get(':id/offers')
  async findOffers(@Param('id') requestId: string) {
    return this.deliveryService.findOffersForRequest(requestId);
  }

  @Post(':id/offers/:offerId/accept')
  async acceptOffer(
    @Param('id') requestId: string,
    @Param('offerId') offerId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deliveryService.acceptOffer(requestId, offerId, user.userId);
  }

  @Post(':id/complete')
  async markAsCompleted(
    @Param('id') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deliveryService.markAsCompleted(requestId, user.userId);
  }

  @Post(':id/assign')
  async assign(
    @Param('id') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignLivreurDto,
  ) {
    return this.deliveryService.assignToLivreur(requestId, user.userId, dto.livreurId);
  }
}