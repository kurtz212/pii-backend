import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByPhoneWithPassword(dto.phone);

    // Volontairement le même message d'erreur, que le numéro n'existe
    // pas ou que le mot de passe soit faux — ça évite de révéler à un
    // attaquant si un numéro de téléphone est déjà inscrit.
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
}