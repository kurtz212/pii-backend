import { IsArray, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { EspaceType } from '../../espaces/espace-type.enum';

export class CreateQuoteRequestDto {
  @IsEnum(EspaceType, { message: 'Type de cible invalide' })
  targetType!: EspaceType;

  // Vide ou omis = diffusion à toutes les agences du targetType.
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetEspaceIds?: string[];

  @IsObject()
  details!: Record<string, unknown>;
}