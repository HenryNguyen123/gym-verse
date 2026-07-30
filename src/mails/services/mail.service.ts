import { Injectable } from '@nestjs/common';
import { MailUtil } from '../util/mail.util';

@Injectable()
export class MailService {
  constructor(private readonly mailUtil: MailUtil) {}

  async sendWelcomeMail(to: string, name: string) {
    await this.mailUtil.send(to, 'welcome', './test', { name });
  }

  //step: send verify mail
  async sendVerifyMail(
    to: string,
    name: string,
    verify_link: string,
    expire_time: string,
  ) {
    await this.mailUtil.send(to, 'verify', './verify', {
      name,
      verify_link,
      expire_time,
      year: new Date().getFullYear(),
    });
  }

  //step: send forget password
  async sendForgotPasswordMail(
    to: string,
    name: string,
    resetLink: string,
    resetTime: string,
  ) {
    await this.mailUtil.send(to, 'forget pasword', './forget-password', {
      name,
      resetLink,
      resetTime,
    });
  }
}
