import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Espace } from './espace.entity';
import { EspacesService } from './espaces.service';
import { EspacesController } from './espaces.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Espace]), UsersModule],
  controllers: [EspacesController],
  providers: [EspacesService],
  exports: [EspacesService],
})
export class EspacesModule {}