import {pool} from './db';
export const POLES=['Bureau','ActiCo','Qualité','Marketing','Non affecté'] as const;
let initialized:Promise<unknown>|undefined;
export async function ensureMembers(){
 if(!pool)throw new Error('Base indisponible');
 if(!initialized)initialized=(async()=>{
  await pool.query(`CREATE TABLE IF NOT EXISTS jle_members (
   user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
   role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')),
   pole TEXT NOT NULL DEFAULT 'Non affecté' CHECK(pole IN ('Bureau','ActiCo','Qualité','Marketing','Non affecté')),
   post TEXT NOT NULL DEFAULT '',updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const ids=(process.env.ADMIN_USER_IDS??'').split(',').map(s=>s.trim()).filter(Boolean);
  if(ids.length)await pool.query(`INSERT INTO jle_members(user_id,role) SELECT id,'admin' FROM "user" WHERE id=ANY($1::text[]) ON CONFLICT(user_id) DO NOTHING`,[ids]);
 })().catch(e=>{initialized=undefined;throw e});
 await initialized;
}
export async function membership(id:string){await ensureMembers();const {rows}=await pool!.query('SELECT role,pole,post FROM jle_members WHERE user_id=$1',[id]);return rows[0] as {role:'admin'|'member';pole:string;post:string}|undefined;}
