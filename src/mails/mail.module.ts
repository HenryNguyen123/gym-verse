import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthMailController } from 'src/mails/controllers/auth/auth-mailer.controller';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailUtil } from 'src/mails/util/mail.util';
import { MailService } from 'src/mails/services/mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import 'dotenv/config';
import { UserMailProcesor } from 'src/bullMQ-worker/processors/mails/users/user-mail.processor.bullMQWorker';

@Module({
  imports: [
    ConfigModule,

    //redis
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),
    // BullModule.registerQueue({
    //   name: 'mail',
    // }),

    //mailer
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASSWORD'),
          },
        },
        defaults: {
          from: '"No Reply" <noreply@example.com>',
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  controllers: [AuthMailController],
  providers: [MailUtil, MailService, UserMailProcesor],
  exports: [MailUtil, MailService],
})
export class MailModule {}
