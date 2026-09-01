import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    if (!text.trim() || sourceLang === targetLang) {
      return text;
    }

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.warn(`Échec traduction (HTTP ${response.status}), retour au texte original`);
        return text;
      }
      const data = (await response.json()) as {
        responseData?: { translatedText?: string };
        responseStatus?: number;
      };
      const translated = data.responseData?.translatedText;
      if (!translated || translated.includes('MYMEMORY WARNING')) {
        return text;
      }
      return translated;
    } catch (error) {
      this.logger.warn(`Erreur de traduction, retour au texte original: ${error}`);
      return text;
    }
  }
}