import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publication } from './publication.entity';
import { PublicationsService } from './publications.service';
import { PublicationsController } from './publications.controller';
import { EspacesModule } from '../espaces/espaces.module';

@Module({
  imports: [TypeOrmModule.forFeature([Publication]), EspacesModule],
  controllers: [PublicationsController],
  providers: [PublicationsService],
  exports: [PublicationsService],
})
export class PublicationsModule {}