import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetCode } from './password-reset-code.entity';
import { EmailService } from './email.service';

const CODE_EXPIRY_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(PasswordResetCode)
    private readonly resetCodesRepository: Repository<PasswordResetCode>,
    private readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByPhoneWithPassword(dto.phone);

    if (!user) {
      throw new UnauthorizedException('Numéro ou mot de passe incorrect');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Numéro ou mot de passe incorrect');
    }

    const accessToken = this.jwtService.sign({ sub: user.id, phone: user.phone });

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
      },
    };
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ sent: boolean }> {
    const user = await this.usersService.findByPhone(dto.phone);

    // Même réponse que le numéro existe ou non — évite de révéler
    // quels numéros sont inscrits (comme pour la connexion).
    if (!user) {
      return { sent: true };
    }

    if (dto.channel === 'sms') {
      throw new BadRequestException(
        'La réinitialisation par SMS n\'est pas encore disponible. Utilise l\'email pour l\'instant.',
      );
    }

    if (!user.email) {
      throw new BadRequestException(
        'Aucun email enregistré sur ce compte. Ajoute un email dans ton profil, ou contacte le support.',
      );
    }

    if (!this.emailService.isConfigured) {
      throw new BadRequestException(
        'Le service d\'email n\'est pas encore configuré côté serveur.',
      );
    }

    const code = this.generateCode();
    const resetCode = this.resetCodesRepository.create({
      userId: user.id,
      code,
      expiresAt: new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000),
    });
    await this.resetCodesRepository.save(resetCode);

    await this.emailService.sendPasswordResetCode(user.email, code);

    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean }> {
    const user = await this.usersService.findByPhone(dto.phone);
    if (!user) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    const resetCode = await this.resetCodesRepository.findOne({
      where: { userId: user.id, code: dto.code, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!resetCode || resetCode.expiresAt < new Date()) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, passwordHash);

    resetCode.used = true;
    await this.resetCodesRepository.save(resetCode);

    return { success: true };
  }
}