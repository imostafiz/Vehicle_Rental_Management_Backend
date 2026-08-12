import path from 'path';
import dotenv from 'dotenv';
import type { Knex } from 'knex';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const baseConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'vehicle_rental',
  },
  pool: {
    min: Number(process.env.DB_POOL_MIN) || 2,
    max: Number(process.env.DB_POOL_MAX) || 10,
  },
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
    extension: 'ts',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.resolve(__dirname, 'seeds'),
    extension: 'ts',
  },
};

const config: { [key: string]: Knex.Config } = {
  development: baseConfig,
  production: baseConfig,
  staging: baseConfig,
};

export default config;
