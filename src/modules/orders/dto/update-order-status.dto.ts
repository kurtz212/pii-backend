import { IsEnum } from 'class-validator';
import { OrderStatus } from '../order.enums';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Statut invalide' })
  status!: OrderStatus;
}