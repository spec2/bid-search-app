import { Pool } from 'pg';

// This function creates and returns a new PostgreSQL client pool.
// It reads environment variables directly from process.env
export function createDbPool() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // For local development with `next dev`, we connect to localhost.
  // For production on Cloudflare, OpenNext will map the env vars from wrangler.toml.
  const host = isDevelopment ? 'localhost' : process.env.DB_HOSTNAME;
  
  // In development, dotenv loads .env. In production, Cloudflare provides these.
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: host,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_DATABASE,
    ssl: isDevelopment ? false : { rejectUnauthorized: false },
  });
  return pool;
}
