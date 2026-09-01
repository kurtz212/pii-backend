import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentMethod, ReceptionMode } from '../order.enums';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  publicationId!: string;

  @IsEnum(PaymentMethod, { message: 'Mode de paiement invalide' })
  paymentMethod!: PaymentMethod;

  @IsEnum(ReceptionMode, { message: 'Mode de réception invalide' })
  receptionMode!: ReceptionMode;

  @IsString()
  @IsOptional()
  notes?: string;
}