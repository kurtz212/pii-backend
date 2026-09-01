import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateEspaceDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsObject()
  @IsOptional()
  details?: Record<string, unknown>;
}