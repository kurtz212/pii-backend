import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { SendGroupMessageDto } from './dto/send-group-message.dto';

interface AuthenticatedUser {
  userId: string;
  phone: string;
}

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.userId, dto);
  }

  @Get()
  async findByEspace(@Query('espaceId') espaceId: string) {
    return this.groupsService.findByEspace(espaceId);
  }

  @Get('mine')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.findMyGroups(user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Post(':id/join')
  async join(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.groupsService.join(id, user.userId);
    return { joined: true };
  }

  @Get(':id/messages')
  async findMessages(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.findMessages(id, user.userId);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendGroupMessageDto,
  ) {
    return this.groupsService.sendMessage(id, user.userId, dto.content);
  }
}