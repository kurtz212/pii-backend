import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { EspaceType } from '../espace-type.enum';

export class CreateEspaceDto {
  @IsEnum(EspaceType, { message: 'Type d\'espace invalide' })
  type: EspaceType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsObject()
  @IsOptional()
  details?: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  affiliationCode!: string;
}