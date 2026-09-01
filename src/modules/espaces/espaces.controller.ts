import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EspacesService } from './espaces.service';
import { CreateEspaceDto } from './dto/create-espace.dto';
import { UpdateEspaceDto } from './dto/update-espace.dto';

interface AuthenticatedUser {
  userId: string;
  phone: string;
}

@Controller('espaces')
@UseGuards(JwtAuthGuard)
export class EspacesController {
  constructor(private readonly espacesService: EspacesService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEspaceDto,
  ) {
    return this.espacesService.create(user.userId, dto);
  }

  @Get('mine')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.espacesService.findAllByOwner(user.userId);
  }

  @Get()
  async findAll(@Query('type') type?: string, @Query('category') category?: string) {
    return this.espacesService.findPublic(type, category);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.espacesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEspaceDto,
  ) {
    return this.espacesService.update(id, user.userId, dto);
  }
}