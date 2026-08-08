import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from 'src/mails/services/mail.service';
export enum MailJobName {
  SEND_VERIFY_MAIL = 'send-verify-mail',
  SEND_FORGET_PASSWORD = 'send-forget-password',
  // SEND_RESET_PASSWORD = 'send-reset-password',
}
interface SendVerifyMailType {
  mail: string;
  fullName: string;
  verifyLink: string;
  expireTime: string;
}
interface SendForgetMailType {
  mail: string;
  fullName: string;
  resetLink: string;
  resetTime: string;
}
@Processor('mail')
export class UserMailProcesor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }
  async process(job: Job<unknown, unknown, MailJobName>) {
    switch (job.name) {
      case MailJobName.SEND_VERIFY_MAIL: {
        const verifyMail = job.data as SendVerifyMailType;
        const to: string = verifyMail.mail;
        await this.mailService.sendVerifyMail(
          to,
          verifyMail.fullName,
          verifyMail.verifyLink,
          verifyMail.expireTime,
        );
        break;
      }
      case MailJobName.SEND_FORGET_PASSWORD: {
        const forgetMail = job.data as SendForgetMailType;
        const to: string = forgetMail.mail;
        await this.mailService.sendForgotPasswordMail(
          to,
          forgetMail.fullName,
          forgetMail.resetLink,
          forgetMail.resetTime,
        );
        break;
      }
      default:
        throw new Error(`Unknown mail job`);
      // throw new Error(`Unknown mail job: ${job.name}`);
    }
  }
}
