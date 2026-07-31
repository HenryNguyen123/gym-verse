import { NestExpressApplication } from '@nestjs/platform-express';

export const cors = (app: NestExpressApplication) => {
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:9090'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Cho phép gửi cookie
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
};
