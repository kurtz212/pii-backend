import { IsIn, IsOptional, IsString } from 'class-validator';

const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'ar', 'pt', 'de', 'it'];

export class UpdateLanguagePreferencesDto {
  @IsIn(SUPPORTED_LANGUAGES, {
    message: `Langue non supportée. Choix possibles : ${SUPPORTED_LANGUAGES.join(', ')}`,
  })
  @IsOptional()
  preferredTextLanguage?: string;

  @IsString()
  @IsOptional()
  preferredAudioLanguage?: string;
}