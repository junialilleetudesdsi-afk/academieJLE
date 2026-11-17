import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { pool, ensureAttempts } from '../../../lib/db';
import { validateAttempt } from '../../../lib/training.mjs';
import catalog from '../../../content/catalog.json';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
async function user(req:NextRequest){ return auth ? (await auth.api.getSession({headers:req.headers}))?.user : null; }
export async function GET(req:NextRequest){
 try {
  const member=await user(req);if(!member)return reply({error:'Connexion nécessaire.'},401);
  await ensureAttempts();
  const {rows}=await pool!.query('SELECT id, mode, score, total, duration, results, created_at AS "createdAt" FROM jle_attempts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[member.id]);
  return reply({attempts:rows});
 }catch{return reply({error:'Historique indisponible. Réessayez dans un instant.'},503);}
}
export async function POST(req:NextRequest){
 try {
  const member=await user(req);if(!member)return reply({error:'Connexion nécessaire.'},401);
  // Reject cross-site cookie requests, including submissions from foreign origins.
  const origin=req.headers.get('origin');
  if(req.headers.get('sec-fetch-site')==='cross-site'||(origin&&origin!==req.nextUrl.origin)) return reply({error:'Origine non autorisée.'},403);
  if(Number(req.headers.get('content-length')||0)>20000)return reply({error:'Requête trop volumineuse.'},413);
  const text=await req.text();if(text.length>20000)return reply({error:'Requête trop volumineuse.'},413);
  let result;
  try {result=validateAttempt(catalog.questions,JSON.parse(text));}catch{return reply({error:'Réponses invalides.'},400);}
  await ensureAttempts();
  const {rows}=await pool!.query(`INSERT INTO jle_attempts(user_id,id,mode,score,total,duration,results,catalog_version)
   VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8) ON CONFLICT(user_id,id) DO NOTHING RETURNING id`,
   [member.id,result.id,result.mode,result.score,result.total,result.duration,JSON.stringify(result.results),catalog.version]);
  const saved=await pool!.query('SELECT id,mode,score,total,duration,results,created_at AS "createdAt" FROM jle_attempts WHERE user_id=$1 AND id=$2',[member.id,result.id]);
  return reply({attempt:saved.rows[0]},rows.length?201:200);
 }catch{return reply({error:'Enregistrement impossible. Votre correction reste disponible ; vous pouvez réessayer.'},503);}
}
