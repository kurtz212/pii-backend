import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PublicationsService } from './publications.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';

interface AuthenticatedUser {
  userId: string;
  phone: string;
}

@Controller('publications')
@UseGuards(JwtAuthGuard)
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePublicationDto) {
    return this.publicationsService.create(user.userId, dto);
  }

  @Get()
  async findFeed(@Query('espaceId') espaceId?: string) {
    return this.publicationsService.findFeed(espaceId);
  }

  @Get('mine')
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('espaceId') espaceId: string,
  ) {
    return this.publicationsService.findMyPublications(espaceId, user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.publicationsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePublicationDto,
  ) {
    return this.publicationsService.update(id, user.userId, dto);
  }
}