import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TontinesService } from './tontines.service';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { ProposeCalendarDto } from './dto/propose-order.dto';
import { RespondToProposalDto } from './dto/respond-to-proposal.dto';
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

  @Post(':id/propose-calendar')
  async proposeCalendar(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ProposeCalendarDto,
  ) {
    return this.tontinesService.proposeCalendar(id, user.userId, dto.assignments);
  }

  @Post(':id/respond')
  async respond(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RespondToProposalDto,
  ) {
    return this.tontinesService.respondToProposal(id, user.userId, dto.accept, dto.requestedOrder);
  }

  @Post(':id/finalize')
  async finalize(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tontinesService.finalizeCalendar(id, user.userId);
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