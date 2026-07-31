import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { cors } from 'src/configs/cors';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // set global prefix
  app.setGlobalPrefix('api/v1');
  //cors
  cors(app);
  // set static assets
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });
  //cookie parser
  app.use(cookieParser());
  // set global pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  //swagger
  const config = new DocumentBuilder()
    .setTitle('Gym Serse')
    .setDescription('The Gym Serse NestJS API description')
    .setVersion('1.0')
    .addTag('Gym Serse')
    .addBearerAuth() // for jwt token
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
