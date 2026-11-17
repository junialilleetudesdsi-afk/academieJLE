import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
export const configured = Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
export const auth = configured ? betterAuth({
 database: new Pool({ connectionString: process.env.DATABASE_URL }),
 emailAndPassword: { enabled: true, minPasswordLength: 12 },
 rateLimit: { enabled: true, storage: 'database' },
}) : null;
