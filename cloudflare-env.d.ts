// cloudflare-env.d.ts
interface CloudflareEnv {
  // These are defined in wrangler.toml
  // For local development, they are loaded from .dev.vars
  // For production, they should be set as secrets
  DB_USER: string;
  DB_PASSWORD?: string;
  DB_HOSTNAME: string;
  DB_PORT: string;
  DB_DATABASE: string;
}
