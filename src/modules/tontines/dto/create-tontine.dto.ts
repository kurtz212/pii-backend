import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateTontineDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  articleName?: string;

    @IsNumber()
  @IsPositive()
  @IsOptional()
  articlePrice?: number;

  @IsString()
  @IsOptional()
  articleImageUrl?: string;

  @IsString()
  @IsOptional()
  confidentialityPolicy?: string;

  @IsNumber()
  @IsPositive()
  contributionAmount!: number;

  @IsInt()
  @Min(2, { message: 'Une tontine necessite au moins 2 participants' })
  maxParticipants!: number;
}
