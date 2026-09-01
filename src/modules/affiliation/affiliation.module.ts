import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AffiliationService } from './affiliation.service';
import { AffiliationController } from './affiliation.controller';

@Module({
  imports: [UsersModule],
  controllers: [AffiliationController],
  providers: [AffiliationService],
  exports: [AffiliationService],
})
export class AffiliationModule {}