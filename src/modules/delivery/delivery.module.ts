import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryRequest } from './delivery-request.entity';
import { DeliveryOffer } from './delivery-offer.entity';
import { DeliveryReview } from './delivery-review.entity';
import { DeliveryAgencyMember } from './delivery-agency-member.entity';
import { Espace } from '../espaces/espace.entity';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { DeliveryTeamController } from './delivery-team.controller';
import { TeamInvitesController } from './team-invites.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeliveryRequest,
      DeliveryOffer,
      DeliveryReview,
      DeliveryAgencyMember,
      Espace,
    ]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [DeliveryController, DeliveryTeamController, TeamInvitesController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}