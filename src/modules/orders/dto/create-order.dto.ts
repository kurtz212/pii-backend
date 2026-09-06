import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod, ReceptionMode } from '../order.enums';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  publicationId!: string;

  @IsInt()
  @Min(1, { message: 'La quantité doit être au moins 1' })
  @IsOptional()
  quantity?: number;

  @IsEnum(PaymentMethod, { message: 'Mode de paiement invalide' })
  paymentMethod!: PaymentMethod;

  @IsEnum(ReceptionMode, { message: 'Mode de réception invalide' })
  receptionMode!: ReceptionMode;

  @IsString()
  @IsOptional()
  notes?: string;
}