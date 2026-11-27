import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {currentMember} from '../../../../lib/session';
import {accessStatus} from '../../../../lib/access.mjs';
import {pool} from '../../../../lib/db';
import {ensureMembers,POLES} from '../../../../lib/membership';
import {accountBatch} from '../../../../lib/account-input.mjs';
import {auth} from '../../../../lib/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(req:NextRequest){
 try{
  const member=await currentMember(req.headers),status=accessStatus(member,true);
  if(status!==200)return reply({error:status===401?'Connexion nécessaire.':'Accès réservé aux administrateurs.'},status);
  if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Origine non autorisée.'},403);
  if(Number(req.headers.get('content-length')??0)>30000)return reply({error:'Requête trop volumineuse.'},413);
  const text=await req.text();if(text.length>30000)return reply({error:'Requête trop volumineuse.'},413);
  let input;try{input=accountBatch(JSON.parse(text))}catch(e){return reply({error:e instanceof Error?e.message:'Liste invalide.'},400)}
  await ensureMembers();const context=await auth!.$context;
  const db=await pool!.connect();
  try{
   await db.query('BEGIN');await db.query('SELECT pg_advisory_xact_lock(2627001)');
   let created=0,existing=0;const users=[];
   for(const row of input.users){
    const found=await db.query('SELECT id,name FROM "user" WHERE lower(email)=$1 FOR UPDATE',[row.email]);
    let id:string;
    if(found.rows.length){id=found.rows[0].id;existing++}
    else{
     id=randomUUID();const hash=await context.password.hash(input.password);
     await db.query(`INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt") VALUES($1,$2,$3,false,NOW(),NOW())`,[id,row.name,row.email]);
     await db.query(`INSERT INTO "account"(id,"userId","accountId","providerId",password,"createdAt","updatedAt") VALUES($1,$2,$2,'credential',$3,NOW(),NOW())`,[randomUUID(),id,hash]);created++;
    }
    await db.query(`INSERT INTO jle_members(user_id,role,pole,post) VALUES($1,'member',$2,$3) ON CONFLICT(user_id) DO UPDATE SET pole=EXCLUDED.pole,post=EXCLUDED.post,updated_at=NOW()`,[id,row.pole,row.post]);
    users.push({email:row.email,id,created:!found.rows.length});
   }
   await db.query('COMMIT');return reply({created,existing,users});
  }catch{await db.query('ROLLBACK');throw Error('Import échoué')}finally{db.release()}
 }catch{return reply({error:'Création impossible. Aucune modification partielle n’a été conservée.'},503)}
}
export async function PATCH(req:NextRequest){
 try{
  const member=await currentMember(req.headers),status=accessStatus(member,true);
  if(status!==200)return reply({error:status===401?'Connexion nécessaire.':'Accès réservé aux administrateurs.'},status);
  if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Origine non autorisée.'},403);
  const text=await req.text();if(text.length>2000)return reply({error:'Requête trop volumineuse.'},413);
  let body;try{body=JSON.parse(text)}catch{return reply({error:'Requête invalide.'},400)}
  if(typeof body.id!=='string'||body.id.length>256||!['member','admin'].includes(body.role)||!POLES.includes(body.pole)||typeof body.post!=='string'||body.post.length>120)return reply({error:'Rôle ou pôle invalide.'},400);
  if(body.id===member!.id&&body.role!=='admin')return reply({error:'Vous ne pouvez pas retirer votre propre accès administrateur.'},409);
  await ensureMembers();const db=await pool!.connect();
  try{
   await db.query('BEGIN');await db.query('LOCK TABLE jle_members IN SHARE ROW EXCLUSIVE MODE');
   const user=await db.query('SELECT id FROM "user" WHERE id=$1',[body.id]);if(!user.rows.length){await db.query('ROLLBACK');return reply({error:'Compte introuvable.'},404)}
   const admins=await db.query("SELECT count(*)::int AS count FROM jle_members WHERE role='admin' AND user_id<>$1",[body.id]);
   if(body.role!=='admin'&&admins.rows[0].count===0){await db.query('ROLLBACK');return reply({error:'Conservez au moins un administrateur.'},409)}
   await db.query(`INSERT INTO jle_members(user_id,role,pole,post) VALUES($1,$2,$3,$4) ON CONFLICT(user_id) DO UPDATE SET role=EXCLUDED.role,pole=EXCLUDED.pole,post=EXCLUDED.post,updated_at=NOW()`,[body.id,body.role,body.pole,body.post]);
   await db.query('COMMIT');return reply({saved:true});
  }catch{await db.query('ROLLBACK');throw Error()}finally{db.release()}
 }catch{return reply({error:'Modification impossible.'},503)}
}
