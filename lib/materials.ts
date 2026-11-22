import {pool} from './db';
let initialized:Promise<unknown>|undefined;
export async function ensureMaterials(){
 if(!pool)throw new Error('Base indisponible');
 if(!initialized)initialized=pool.query(`CREATE TABLE IF NOT EXISTS jle_materials (
 id TEXT PRIMARY KEY,
 pdf BYTEA NOT NULL,
 transcript JSONB NOT NULL,
 sha256 TEXT NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 )`).catch(error=>{initialized=undefined;throw error});
 await initialized;
}
