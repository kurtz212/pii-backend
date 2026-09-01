import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DeliveryService } from './delivery.service';

interface AuthenticatedUser {
  userId: string;
  phone: string;
}

interface RespondDto {
  accept: boolean;
}

@Controller('team-invites')
@UseGuards(JwtAuthGuard)
export class TeamInvitesController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('mine')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryService.findMyInvites(user.userId);
  }

  @Post(':id/respond')
  async respond(
    @Param('id') membershipId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RespondDto,
  ) {
    return this.deliveryService.respondToInvite(membershipId, user.userId, dto.accept);
  }
}