import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QuotesService } from './quotes.service';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { SubmitQuoteDto } from './dto/submit-quote.dto';

interface AuthenticatedUser {
  userId: string;
  phone: string;
}

@Controller('quote-requests')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuoteRequestDto) {
    return this.quotesService.createRequest(user.userId, dto);
  }

  @Get('mine')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.quotesService.findMyRequests(user.userId);
  }

  @Get('received')
  async findReceived(
    @CurrentUser() user: AuthenticatedUser,
    @Query('espaceId') espaceId: string,
  ) {
    return this.quotesService.findReceivedRequests(espaceId, user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Get(':id/quotes')
  async findQuotes(@Param('id') id: string) {
    return this.quotesService.findQuotesForRequest(id);
  }

  // ?espaceId=xxx précise en tant que quelle agence l'utilisateur répond
  @Post(':id/quotes')
  async submitQuote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('espaceId') espaceId: string,
    @Body() dto: SubmitQuoteDto,
  ) {
    return this.quotesService.submitQuote(id, espaceId, user.userId, dto);
  }

  @Post(':id/quotes/:quoteId/accept')
  async acceptQuote(
    @Param('id') id: string,
    @Param('quoteId') quoteId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.quotesService.acceptQuote(id, quoteId, user.userId);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.quotesService.cancelRequest(id, user.userId);
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.quotesService.completeRequest(id, user.userId);
  }
}