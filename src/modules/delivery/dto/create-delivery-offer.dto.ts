import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateDeliveryOfferDto {
  @IsNumber()
  @IsPositive()
  price!: number;

  @IsString()
  @IsOptional()
  espaceId?: string;
}