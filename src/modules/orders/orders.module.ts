import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Publication } from '../publications/publication.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EspacesModule } from '../espaces/espaces.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Publication]), EspacesModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}