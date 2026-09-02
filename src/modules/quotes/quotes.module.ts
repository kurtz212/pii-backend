import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from './quote-request.entity';
import { Quote } from './quote.entity';
import { Espace } from '../espaces/espace.entity';
import { User } from '../users/user.entity';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest, Quote, Espace, User]), NotificationsModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}