import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly usersService: UsersService) {}

  async send(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      if (!user?.pushToken) {
        return;
      }

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          to: user.pushToken,
          title,
          body,
          data: data ?? {},
          sound: 'default',
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Échec envoi notification (HTTP ${response.status}) pour ${userId}`);
      }
    } catch (error) {
      this.logger.warn(`Erreur envoi notification pour ${userId}: ${error}`);
    }
  }
}