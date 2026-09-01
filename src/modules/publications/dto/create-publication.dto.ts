import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { PublicationContentType } from '../publication-content-type.enum';

export class CreatePublicationDto {
  @IsString()
  @IsNotEmpty()
  espaceId!: string;

  @IsEnum(PublicationContentType, { message: 'Type de contenu invalide' })
  contentType!: PublicationContentType;

  @IsString()
  @IsNotEmpty()
  title!: string;

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

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;
}