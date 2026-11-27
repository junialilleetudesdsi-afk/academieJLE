import {NextRequest,NextResponse} from 'next/server';
import {currentMember} from '../../../lib/session';
import {pool,ensureAttempts} from '../../../lib/db';
import {ensureMembers} from '../../../lib/membership';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:NextRequest){
 try{
  if(!await currentMember(req.headers))return NextResponse.json({error:'Connexion nécessaire.'},{status:401,headers});
  const days=Number(req.nextUrl.searchParams.get('days')??30),mode=req.nextUrl.searchParams.get('mode')??'';
  if(![0,7,30,90].includes(days)||!['','Quiz express','Par thème','Par formation','Examen blanc','Mes erreurs'].includes(mode))return NextResponse.json({error:'Filtre invalide.'},{status:400,headers});
  await ensureMembers();await ensureAttempts();
  const {rows}=await pool!.query(`WITH activity AS (
   SELECT user_id,count(*)::int AS attempts,sum(score)::int AS score,sum(total)::int AS total,sum(duration)::int AS duration,max(created_at) AS last_activity
   FROM jle_attempts WHERE ($1::int=0 OR created_at>=NOW()-($1::int*INTERVAL '1 day')) AND ($2::text='' OR mode=$2) GROUP BY user_id
  ) SELECT m.pole,count(*)::int AS members,count(a.user_id)::int AS active,COALESCE(sum(a.attempts),0)::int AS attempts,
   COALESCE(sum(a.score),0)::int AS score,COALESCE(sum(a.total),0)::int AS total,COALESCE(sum(a.duration),0)::int AS duration,max(a.last_activity) AS "lastActivity"
   FROM jle_members m LEFT JOIN activity a ON a.user_id=m.user_id GROUP BY m.pole ORDER BY m.pole`,[days,mode]);
  return NextResponse.json({poles:rows,days,mode},{headers});
 }catch{return NextResponse.json({error:'Suivi des pôles indisponible.'},{status:503,headers})}
}
