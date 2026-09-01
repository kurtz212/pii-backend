import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TontinesService } from './tontines.service';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { ProposeOrderDto } from './dto/propose-order.dto';
import { ValidateCalendarDto } from './dto/validate-calendar.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';

interface AuthenticatedUser {
  userId: string;
  phone: string;
}

@Controller('tontines')
@UseGuards(JwtAuthGuard)
export class TontinesController {
  constructor(private readonly tontinesService: TontinesService) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTontineDto) {
    return this.tontinesService.create(user.userId, dto);
  }

  @Get('mine')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.tontinesService.findMyTontines(user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tontinesService.findOne(id);
  }

  @Get(':id/participants')
  async findParticipants(@Param('id') id: string) {
    return this.tontinesService.findParticipants(id);
  }

  @Post(':id/join')
  async join(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.tontinesService.join(id, user.userId);
    return { joined: true };
  }

  @Patch(':id/my-order')
  async proposeOrder(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ProposeOrderDto,
  ) {
    return this.tontinesService.proposeOrder(id, user.userId, dto.proposedOrder);
  }

  @Post(':id/validate')
  async validate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ValidateCalendarDto,
  ) {
    return this.tontinesService.validateCalendar(id, user.userId, dto.orderedUserIds);
  }

  @Get(':id/contributions')
  async findContributions(@Param('id') id: string, @Query('round') round?: string) {
    return this.tontinesService.findContributions(id, round ? Number(round) : undefined);
  }

  @Patch(':id/contributions/:contributionId')
  async updateContribution(
    @Param('id') id: string,
    @Param('contributionId') contributionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateContributionDto,
  ) {
    return this.tontinesService.updateContribution(id, contributionId, user.userId, dto.status);
  }
}