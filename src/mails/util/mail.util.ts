import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailUtil {
  private readonly logger = new Logger(MailUtil.name);

  constructor(private readonly mailerService: MailerService) {}

  async send(
    to: string,
    subject: string,
    template: string,
    context?: Record<string, any>,
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });

      this.logger.log(`Mail sent -> ${to}`);
    } catch (error) {
      this.logger.error(`Mail failed -> ${to}`, error);
      throw error;
    }
  }
}
