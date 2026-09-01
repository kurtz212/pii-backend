import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BadgesService } from './badges.service';

@Controller('espaces')
@UseGuards(JwtAuthGuard)
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get(':id/badge')
  async getBadge(@Param('id') id: string) {
    return this.badgesService.getBadgeInfo(id);
  }
}