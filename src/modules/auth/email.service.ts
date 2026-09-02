import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Envoi d'emails via Gmail SMTP — gratuit, nécessite juste un compte
// Google avec un "mot de passe d'application" généré dans les
// paramètres de sécurité du compte (pas le mot de passe normal du
// compte). Voir https://myaccount.google.com/apppasswords
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('GMAIL_USER');
    const pass = this.configService.get<string>('GMAIL_APP_PASSWORD');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        'GMAIL_USER / GMAIL_APP_PASSWORD non configurés — l\'envoi d\'email est désactivé.',
      );
    }
  }

  get isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendPasswordResetCode(to: string, code: string): Promise<void> {
    if (!this.transporter) {
      throw new Error('Service email non configuré');
    }
    await this.transporter.sendMail({
      from: `"Pii" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject: 'Code de réinitialisation - Pii',
      text: `Ton code de réinitialisation est : ${code}\n\nCe code expire dans 15 minutes.\n\nSi tu n'as pas demandé ce code, ignore cet email.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #1a7a3c;">Réinitialisation de mot de passe</h2>
          <p>Voici ton code de vérification :</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1a7a3c;">${code}</p>
          <p style="color: #666; font-size: 13px;">Ce code expire dans 15 minutes. Si tu n'as pas demandé ce code, ignore cet email.</p>
        </div>
      `,
    });
  }
}