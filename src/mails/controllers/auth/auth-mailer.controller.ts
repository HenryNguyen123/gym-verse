import { MailerService } from '@nestjs-modules/mailer';
import { Controller, Get } from '@nestjs/common';
import { MailService } from 'src/mails/services/mail.service';

@Controller('auth/mail')
export class AuthMailController {
  constructor(private readonly mailService: MailService) {}

  // test mail
  @Get('test')
  async testMail() {
    await this.mailService.sendWelcomeMail(
      'nhokkudo143@gmail.com',
      'Nhật đại ca',
    );
  }
}
