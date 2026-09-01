import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { EspacesModule } from './modules/espaces/espaces.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { PublicationsModule } from './modules/publications/publications.module';
import { AffiliationModule } from './modules/affiliation/affiliation.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { GroupsModule } from './modules/groups/groups.module';
import { TontinesModule } from './modules/tontines/tontines.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { BadgesModule } from './modules/badges/badges.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { TranslationModule } from './modules/translation/translation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
    }),
    UsersModule,
    AuthModule,
    EspacesModule,
    DeliveryModule,
    MessagingModule,
    PublicationsModule,
    AffiliationModule,
    OrdersModule,
    UploadsModule,
    GroupsModule,
    TontinesModule,
    ReviewsModule,
    BadgesModule,
    QuotesModule,
    TranslationModule,
    NotificationsModule,
  ],
})
export class AppModule {}