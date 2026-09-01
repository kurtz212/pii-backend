import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { GroupMember } from './group-member.entity';
import { GroupMessage } from './group-message.entity';
import { GroupType } from './group.enums';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly membersRepository: Repository<GroupMember>,
    @InjectRepository(GroupMessage)
    private readonly messagesRepository: Repository<GroupMessage>,
  ) {}

  async create(userId: string, dto: CreateGroupDto): Promise<Group> {
    const group = this.groupsRepository.create({
      espaceId: dto.espaceId,
      creatorId: userId,
      type: dto.type,
      name: dto.name,
      description: dto.description ?? null,
    });
    const saved = await this.groupsRepository.save(group);

    const membership = this.membersRepository.create({
      groupId: saved.id,
      userId,
    });
    await this.membersRepository.save(membership);

    return saved;
  }

  async findByEspace(espaceId: string): Promise<Group[]> {
    return this.groupsRepository.find({
      where: { espaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async findMyGroups(userId: string): Promise<Group[]> {
    return this.groupsRepository
      .createQueryBuilder('group')
      .innerJoin(GroupMember, 'membership', 'membership.groupId = group.id')
      .where('membership.userId = :userId', { userId })
      .orderBy('group.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    return group;
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const membership = await this.membersRepository.findOne({
      where: { groupId, userId },
    });
    return !!membership;
  }

  async join(groupId: string, userId: string): Promise<void> {
    await this.findOne(groupId);
    const already = await this.isMember(groupId, userId);
    if (already) {
      return;
    }
    const membership = this.membersRepository.create({ groupId, userId });
    await this.membersRepository.save(membership);
  }

  async findMessages(groupId: string, userId: string): Promise<GroupMessage[]> {
    const member = await this.isMember(groupId, userId);
    if (!member) {
      throw new ForbiddenException('Rejoins le groupe pour voir les messages');
    }
    return this.messagesRepository.find({
      where: { groupId },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(groupId: string, userId: string, content: string): Promise<GroupMessage> {
    const group = await this.findOne(groupId);
    const member = await this.isMember(groupId, userId);
    if (!member) {
      throw new ForbiddenException('Rejoins le groupe pour écrire un message');
    }
    if (group.type === GroupType.ANNONCES && group.creatorId !== userId) {
      throw new ForbiddenException('Seul le créateur peut publier dans ce canal d\'annonces');
    }

    const message = this.messagesRepository.create({ groupId, senderId: userId, content });
    return this.messagesRepository.save(message);
  }
}