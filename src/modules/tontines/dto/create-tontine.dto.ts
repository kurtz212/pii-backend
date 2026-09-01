import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateTontineDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  contributionAmount!: number;

  @IsInt()
  @Min(2, { message: 'Une tontine nécessite au moins 2 participants' })
  maxParticipants!: number;
}