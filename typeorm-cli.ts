import { DataSource } from 'typeorm';
import { CoffeeRefactor1794005398604 } from './src/migrations/1794005398604-CoffeeRefactor.js';

export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'pass123',
  database: 'postgres',
  entities: [],
  migrations: [CoffeeRefactor1794005398604],
});