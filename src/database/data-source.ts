import { DataSource } from 'typeorm';
import { join } from 'path';
import 'dotenv/config';
console.log({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  pass: process.env.DB_PASSWORD,
  db: process.env.DB_NAME,
});
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '**/*.entity{.ts,.js}')],

  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: false,
});
