import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { MessageType } from './message-type.enum';
import { SendMessageDto } from './dto/send-message.dto';
import { UsersService } from '../users/users.service';
import { TranslationService } from '../translation/translation.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface MessageWithTranslation extends Message {
  translatedContent?: string;
}

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    private readonly usersService: UsersService,
    private readonly translationService: TranslationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findOrCreateConversation(userId: string, recipientId: string): Promise<Conversation> {
    if (userId === recipientId) {
      throw new BadRequestException('Impossible de démarrer une conversation avec toi-même');
    }

    const existing = await this.conversationsRepository
      .createQueryBuilder('conversation')
      .where(
        '(conversation.participantOneId = :userId AND conversation.participantTwoId = :recipientId) OR ' +
          '(conversation.participantOneId = :recipientId AND conversation.participantTwoId = :userId)',
        { userId, recipientId },
      )
      .getOne();

    if (existing) {
      return existing;
    }

    const conversation = this.conversationsRepository.create({
      participantOneId: userId,
      participantTwoId: recipientId,
      lastMessageAt: null,
    });
    return this.conversationsRepository.save(conversation);
  }

   async findMyConversations(userId: string): Promise<(Conversation & { unreadCount: number })[]> {
    const conversations = await this.conversationsRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participantOne', 'participantOne')
      .leftJoinAndSelect('conversation.participantTwo', 'participantTwo')
      .where('conversation.participantOneId = :userId OR conversation.participantTwoId = :userId', {
        userId,
      })
      .orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('conversation.createdAt', 'DESC')
      .getMany();

      const results: (Conversation & { unreadCount: number })[] = [];
    for (const conversation of conversations) {
      const unreadCount = await this.messagesRepository
        .createQueryBuilder('message')
        .where('message.conversationId = :conversationId', { conversationId: conversation.id })
        .andWhere('message.senderId != :userId', { userId })
        .andWhere('message.isRead = false')
        .getCount();
      results.push({ ...conversation, unreadCount });
    }

    return results;
  }

  private async assertParticipant(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }
    if (conversation.participantOneId !== userId && conversation.participantTwoId !== userId) {
      throw new ForbiddenException("Tu ne fais pas partie de cette conversation");
    }
    return conversation;
  }

    async findMessages(conversationId: string, userId: string): Promise<MessageWithTranslation[]> {
    await this.assertParticipant(conversationId, userId);
    const messages = await this.messagesRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    // Marque comme lus tous les messages reçus (pas envoyés par
    // soi-même) dès que la conversation est ouverte.
    await this.messagesRepository
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('isRead = false')
      .execute();

    const reader = await this.usersService.findById(userId);
    const readerLang = reader?.preferredTextLanguage ?? 'fr';

    const results: MessageWithTranslation[] = [];
    for (const message of messages) {
      if (message.type !== MessageType.TEXT) {
        results.push(message);
        continue;
      }
      const sender = await this.usersService.findById(message.senderId);
      const senderLang = sender?.preferredTextLanguage ?? 'fr';

      if (senderLang === readerLang) {
        results.push(message);
        continue;
      }

      const translatedContent = await this.translationService.translate(
        message.content,
        senderLang,
        readerLang,
      );
      results.push({ ...message, translatedContent });
    }

    return results;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    const conversation = await this.assertParticipant(conversationId, senderId);

        const message = this.messagesRepository.create({
      conversationId,
      senderId,
      content: dto.content ?? '',
      type: dto.type ?? MessageType.TEXT,
      metadata: dto.metadata ?? null,
    });
    const saved = await this.messagesRepository.save(message);

    await this.conversationsRepository.update(
      { id: conversationId },
      { lastMessageAt: saved.createdAt },
    );

    const notificationLabels: Record<string, string> = {
      image: 'Photo',
      video: 'Vidéo',
      audio: 'Message vocal',
      location: 'Position partagée',
      contact: 'Contact partagé',
      file: 'Fichier',
    };
    const messageType = dto.type ?? MessageType.TEXT;
    const notificationBody =
      messageType === MessageType.TEXT ? dto.content ?? '' : notificationLabels[messageType] ?? 'Nouveau message';

    const recipientId =
      conversation.participantOneId === senderId
        ? conversation.participantTwoId
        : conversation.participantOneId;
    const sender = await this.usersService.findById(senderId);
    this.notificationsService.send(
      recipientId,
      sender?.fullName ?? 'Nouveau message',
      notificationBody,
    );

    return saved;
  }
  
    async getTotalUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.messagesRepository
      .createQueryBuilder('message')
      .innerJoin('message.conversation', 'conversation')
      .where('(conversation.participantOneId = :userId OR conversation.participantTwoId = :userId)', { userId })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.isRead = false')
      .getCount();
    return { count };
  }

}