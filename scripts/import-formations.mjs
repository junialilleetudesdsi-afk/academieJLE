// Local import only. No credentials or document bytes are logged or committed.
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {loadEnvFile} from 'node:process';
import {Pool} from 'pg';
try{loadEnvFile('.env.local')}catch{}
const directory=process.argv[2];
if(!directory){console.error('Usage : npm run formations:import -- "chemin/du/dossier/extrait"');process.exit(1)}
if(!process.env.DATABASE_URL){console.error('DATABASE_URL manquante : configurez votre fichier .env.local ou votre environnement.');process.exit(1)}
const metadata=JSON.parse(await readFile(new URL('../content/formations.json',import.meta.url),'utf8'));
const inputs=[];
for(const item of metadata){
 const pdf=await readFile(path.resolve(directory,item.id+'.pdf'));
 const transcript=JSON.parse(await readFile(path.resolve(directory,item.id+'.json'),'utf8'));
 const digest=createHash('sha256').update(pdf).digest('hex');
 if(pdf.subarray(0,5).toString()!=='%PDF-'||pdf.length>4*1024*1024||digest!==item.sha256)throw new Error('PDF non conforme au lot préparé : '+item.id);
 if(!Array.isArray(transcript.pages)||transcript.pages.length!==item.pages||transcript.pages.some((p,i)=>p.number!==i+1||typeof p.text!=='string'))throw new Error('Transcription non conforme : '+item.id);
 inputs.push({id:item.id,pdf,transcript,digest});
}
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
const db=await pool.connect();
try{
 await db.query('BEGIN');
 await db.query(`CREATE TABLE IF NOT EXISTS jle_materials (id TEXT PRIMARY KEY,pdf BYTEA NOT NULL,transcript JSONB NOT NULL,sha256 TEXT NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
 for(const item of inputs)await db.query(`INSERT INTO jle_materials(id,pdf,transcript,sha256) VALUES($1,$2,$3::jsonb,$4)
 ON CONFLICT(id) DO UPDATE SET pdf=EXCLUDED.pdf,transcript=EXCLUDED.transcript,sha256=EXCLUDED.sha256,updated_at=NOW()`,[item.id,item.pdf,JSON.stringify(item.transcript),item.digest]);
 await db.query('COMMIT');console.log('Import terminé : '+inputs.length+' formations privées, 163 pages. Aucun compte ni résultat de test modifié.');
}catch(error){await db.query('ROLLBACK');console.error('Import annulé, aucune modification partielle.');throw error;}
finally{db.release();await pool.end()}
