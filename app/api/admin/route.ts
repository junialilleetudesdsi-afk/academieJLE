import {NextRequest,NextResponse} from 'next/server';
import {currentMember} from '../../../lib/session';
import {accessStatus,pageNumber} from '../../../lib/access.mjs';
import {pool,ensureAttempts} from '../../../lib/db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:NextRequest){
 try{
  const member=await currentMember(req.headers),status=accessStatus(member,true);
  if(status!==200)return reply({error:status===401?'Connexion nécessaire.':'Accès réservé aux administrateurs.'},status);
  let page:number;try{page=pageNumber(req.nextUrl.searchParams.get('page'));}catch{return reply({error:'Page invalide.'},400);}
  await ensureAttempts();
  const id=req.nextUrl.searchParams.get('userId');
  if(id){
   if(id.length>256)return reply({error:'Compte invalide.'},400);
   const user=await pool!.query('SELECT id,name,email,"emailVerified","createdAt" FROM "user" WHERE id=$1',[id]);
   if(!user.rows.length)return reply({error:'Compte introuvable.'},404);
   const count=await pool!.query('SELECT count(*)::int AS count,COALESCE(sum(score),0)::int AS score,COALESCE(sum(total),0)::int AS total FROM jle_attempts WHERE user_id=$1',[id]);
   const attempts=await pool!.query('SELECT id,mode,score,total,duration,results,catalog_version AS "catalogVersion",created_at AS "createdAt" FROM jle_attempts WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT 25 OFFSET $2',[id,page*25]);
   return reply({user:user.rows[0],attempts:attempts.rows,...count.rows[0],page,pageSize:25});
  }
  const search=(req.nextUrl.searchParams.get('q')??'').trim().slice(0,200);
  const pattern='%'+search.replace(/[\\%_]/g,'\\$&')+'%';
  const filter='($1=\'\' OR name ILIKE $2 OR email ILIKE $2)';
  const count=await pool!.query('SELECT count(*)::int AS count FROM "user" WHERE '+filter,[search,pattern]);
  const users=await pool!.query(`SELECT u.id,u.name,u.email,u."emailVerified",u."createdAt",
   (SELECT count(*)::int FROM jle_attempts a WHERE a.user_id=u.id) AS "attemptCount",
   (SELECT json_build_object('score',a.score,'total',a.total,'mode',a.mode,'createdAt',a.created_at) FROM jle_attempts a WHERE a.user_id=u.id ORDER BY a.created_at DESC,a.id DESC LIMIT 1) AS "lastAttempt"
   FROM "user" u WHERE ${filter} ORDER BY u."createdAt" DESC,u.id LIMIT 25 OFFSET $3`,[search,pattern,page*25]);
  return reply({users:users.rows,count:count.rows[0].count,page,pageSize:25});
 }catch{return reply({error:'Administration indisponible. Réessayez dans un instant.'},503);}
}
