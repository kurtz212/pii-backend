import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publication } from './publication.entity';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { EspacesService } from '../espaces/espaces.service';

@Injectable()
export class PublicationsService {
  constructor(
    @InjectRepository(Publication)
    private readonly publicationsRepository: Repository<Publication>,
    private readonly espacesService: EspacesService,
  ) {}

  async create(userId: string, dto: CreatePublicationDto): Promise<Publication> {
    await this.espacesService.findOwnedEspace(dto.espaceId, userId);

    const publication = this.publicationsRepository.create({
      espaceId: dto.espaceId,
      contentType: dto.contentType,
      title: dto.title,
      description: dto.description ?? null,
      price: dto.price ?? null,
      tranchesActivees: dto.tranchesActivees ?? false,
      presenterEnLive: dto.presenterEnLive ?? false,
      imageUrl: dto.imageUrl ?? null,
      videoUrl: dto.videoUrl ?? null,
    });

    return this.publicationsRepository.save(publication);
  }

  async findFeed(espaceId?: string): Promise<Publication[]> {
    const query = this.publicationsRepository
      .createQueryBuilder('publication')
      .leftJoinAndSelect('publication.espace', 'espace')
      .where('publication.isPaused = false')
      .orderBy('publication.createdAt', 'DESC');

    if (espaceId) {
      query.andWhere('publication.espaceId = :espaceId', { espaceId });
    }

    return query.getMany();
  }

  async findMyPublications(espaceId: string, ownerId: string): Promise<Publication[]> {
    await this.espacesService.findOwnedEspace(espaceId, ownerId);
    return this.publicationsRepository.find({
      where: { espaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Publication> {
    const publication = await this.publicationsRepository.findOne({
      where: { id },
      relations: ['espace'],
    });
    if (!publication) {
      throw new NotFoundException('Publication introuvable');
    }
    return publication;
  }

  async update(id: string, ownerId: string, dto: UpdatePublicationDto): Promise<Publication> {
    const publication = await this.findOne(id);
    if (publication.espace.ownerId !== ownerId) {
      throw new ForbiddenException('Cette publication ne t\'appartient pas');
    }

    if (dto.title !== undefined) publication.title = dto.title;
    if (dto.description !== undefined) publication.description = dto.description;
    if (dto.price !== undefined) publication.price = dto.price;
    if (dto.tranchesActivees !== undefined) publication.tranchesActivees = dto.tranchesActivees;
    if (dto.presenterEnLive !== undefined) publication.presenterEnLive = dto.presenterEnLive;
    if (dto.isPaused !== undefined) publication.isPaused = dto.isPaused;

    return this.publicationsRepository.save(publication);
  }
}