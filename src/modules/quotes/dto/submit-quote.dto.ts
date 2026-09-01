import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class SubmitQuoteDto {
  @IsNumber()
  @IsPositive()
  price!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}