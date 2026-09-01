import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagingService } from './messaging.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

interface AuthenticatedUser {
  userId: string;
  phone: string;
}

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post()
  async start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartConversationDto) {
    return this.messagingService.findOrCreateConversation(user.userId, dto.recipientId);
  }

  @Get('mine')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.findMyConversations(user.userId);
  }

  @Get(':id/messages')
  async findMessages(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.findMessages(id, user.userId);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(id, user.userId, dto);
  }
}