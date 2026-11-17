import { betterAuth } from 'better-auth';
import { pool } from './db';
export const configured = Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
export const auth = configured ? betterAuth({
 database: pool!,
 emailAndPassword: { enabled: true, minPasswordLength: 12 },
 rateLimit: { enabled: true, storage: 'database' },
}) : null;
