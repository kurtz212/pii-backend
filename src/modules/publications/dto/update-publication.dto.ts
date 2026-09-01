import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdatePublicationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  tranchesActivees?: boolean;

  @IsBoolean()
  @IsOptional()
  presenterEnLive?: boolean;

  @IsBoolean()
  @IsOptional()
  isPaused?: boolean;
}