import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DeliveryService } from './delivery.service';
import { InviteLivreurDto } from './dto/invite-livreur.dto';

interface AuthenticatedUser {
  userId: string;
  phone: string;
}

@Controller('espaces')
@UseGuards(JwtAuthGuard)
export class DeliveryTeamController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get(':id/team')
  async findTeam(@Param('id') espaceId: string) {
    return this.deliveryService.findAgencyTeam(espaceId);
  }

  @Post(':id/team/invite')
  async invite(
    @Param('id') espaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteLivreurDto,
  ) {
    return this.deliveryService.inviteLivreur(espaceId, user.userId, dto.phone);
  }

  @Get(':id/deliveries')
  async findAssignments(
    @Param('id') espaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deliveryService.findAgencyAssignments(espaceId, user.userId);
  }
}