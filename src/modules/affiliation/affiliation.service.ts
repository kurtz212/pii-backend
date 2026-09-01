import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UpdateMobileMoneyDto } from './dto/update-mobile-money.dto';

@Injectable()
export class AffiliationService {
  constructor(private readonly usersService: UsersService) {}

  async getMyAffiliationInfo(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return {
      affiliationCode: user.affiliationCode,
      referredByCode: user.referredByCode,
      isCodeFieldLocked: user.referredByCode !== null,
      mobileMoneyOperator: user.mobileMoneyOperator,
      mobileMoneyNumber: user.mobileMoneyNumber,
    };
  }

  async updateMobileMoney(userId: string, dto: UpdateMobileMoneyDto) {
    const user = await this.usersService.updateMobileMoney(userId, dto.operator, dto.number);
    return {
      mobileMoneyOperator: user.mobileMoneyOperator,
      mobileMoneyNumber: user.mobileMoneyNumber,
    };
  }
}