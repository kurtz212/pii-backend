import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tontine } from './tontine.entity';
import { TontineParticipant } from './tontine-participant.entity';
import { TontineContribution } from './tontine-contribution.entity';
import { TontinesService } from './tontines.service';
import { TontinesController } from './tontines.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tontine, TontineParticipant, TontineContribution])],
  controllers: [TontinesController],
  providers: [TontinesService],
  exports: [TontinesService],
})
export class TontinesModule {}