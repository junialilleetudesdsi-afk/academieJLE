import { Pool } from 'pg';
const globalDb = globalThis as unknown as {jlePool?: Pool};
export const pool = process.env.DATABASE_URL ? (globalDb.jlePool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })) : null;
let initialized: Promise<unknown> | undefined;
export async function ensureAttempts() {
 if(!pool) throw new Error('Base indisponible');
 if(!initialized) initialized=pool.query(`CREATE TABLE IF NOT EXISTS jle_attempts (
 user_id TEXT NOT NULL,
 id UUID NOT NULL,
 mode TEXT NOT NULL,
 score INTEGER NOT NULL,
 total INTEGER NOT NULL,
 duration INTEGER NOT NULL,
 results JSONB NOT NULL,
 catalog_version INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(user_id,id)
 )`).catch(error=>{initialized=undefined;throw error;});
 await initialized;
}
