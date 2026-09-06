import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateEspaceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsObject()
  @IsOptional()
  details?: Record<string, unknown>;
}