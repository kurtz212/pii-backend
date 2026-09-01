import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AffiliationService } from './affiliation.service';
import { UpdateMobileMoneyDto } from './dto/update-mobile-money.dto';

interface AuthenticatedUser {
  userId: string;
  phone: string;
}

@Controller('affiliation')
@UseGuards(JwtAuthGuard)
export class AffiliationController {
  constructor(private readonly affiliationService: AffiliationService) {}

  @Get('me')
  async getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.affiliationService.getMyAffiliationInfo(user.userId);
  }

  @Patch('mobile-money')
  async updateMobileMoney(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMobileMoneyDto,
  ) {
    return this.affiliationService.updateMobileMoney(user.userId, dto);
  }
}