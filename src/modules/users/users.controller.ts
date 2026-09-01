import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateLanguagePreferencesDto } from './dto/update-language-preferences.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';

interface AuthenticatedUser {
  userId: string;
  phone: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.userId);
  }

  @Patch('me/kyc')
  @UseGuards(JwtAuthGuard)
  async submitKyc(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitKycDto) {
    return this.usersService.submitKyc(user.userId, dto.idDocumentType, dto.idDocumentNumber);
  }

  @Patch('me/language-preferences')
  @UseGuards(JwtAuthGuard)
  async updateLanguagePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLanguagePreferencesDto,
  ) {
    return this.usersService.updateLanguagePreferences(
      user.userId,
      dto.preferredTextLanguage,
      dto.preferredAudioLanguage,
    );
  }

  @Patch('me/push-token')
  @UseGuards(JwtAuthGuard)
  async updatePushToken(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePushTokenDto) {
    await this.usersService.updatePushToken(user.userId, dto.pushToken);
    return { success: true };
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@CurrentUser() user: AuthenticatedUser, @Query('q') q: string) {
    const results = await this.usersService.search(q ?? '', user.userId);
    return results.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}