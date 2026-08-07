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
    fullName: string,
    verifyLink: string,
    expireTime: string,
  ) {
    await this.mailUtil.send(to, 'verify', './verify', {
      fullName,
      verifyLink,
      expireTime,
      year: new Date().getFullYear(),
    });
  }

  //step: send forget password
  async sendForgotPasswordMail(
    to: string,
    fullName: string,
    resetLink: string,
    resetTime: string,
  ) {
    await this.mailUtil.send(to, 'forget pasword', './forget-password', {
      fullName,
      resetLink,
      resetTime,
    });
  }
}
