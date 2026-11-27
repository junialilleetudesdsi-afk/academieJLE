import {NextRequest,NextResponse} from 'next/server';
import {currentMember} from '../../../lib/session';
import {pool,ensureAttempts} from '../../../lib/db';
import {ensureMembers} from '../../../lib/membership';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:NextRequest){
 try{
  if(!await currentMember(req.headers))return NextResponse.json({error:'Connexion nécessaire.'},{status:401,headers});
  const weeks=Number(req.nextUrl.searchParams.get('weeks')??12);
  if(![8,12,26].includes(weeks))return NextResponse.json({error:'Historique invalide.'},{status:400,headers});
  await ensureMembers();await ensureAttempts();
  const {rows}=await pool!.query(`WITH bounds AS (
   SELECT date_trunc('week',NOW() AT TIME ZONE 'Europe/Paris')::date AS current_week
  ), weeks AS (
   SELECT generate_series(current_week-(($1::int-1)*INTERVAL '1 week'),current_week,INTERVAL '1 week')::date AS week FROM bounds
  ), poles AS (
   SELECT pole,count(*)::int AS members FROM jle_members GROUP BY pole
  ), activity AS (
   SELECT m.pole,date_trunc('week',a.created_at AT TIME ZONE 'Europe/Paris')::date AS week,
    count(*)::int AS attempts,count(DISTINCT a.user_id)::int AS active,sum(a.score)::int AS score,sum(a.total)::int AS total,sum(a.duration)::int AS duration
   FROM jle_attempts a JOIN jle_members m ON m.user_id=a.user_id
   WHERE a.created_at>=((SELECT min(week) FROM weeks)::timestamp AT TIME ZONE 'Europe/Paris') AND a.created_at<=NOW()
   GROUP BY m.pole,date_trunc('week',a.created_at AT TIME ZONE 'Europe/Paris')::date
  ) SELECT p.pole,p.members,to_char(w.week,'YYYY-MM-DD') AS week,(w.week=(SELECT current_week FROM bounds)) AS current,
   COALESCE(a.attempts,0)::int AS attempts,COALESCE(a.active,0)::int AS active,COALESCE(a.score,0)::int AS score,
   COALESCE(a.total,0)::int AS total,COALESCE(a.duration,0)::int AS duration
   FROM poles p CROSS JOIN weeks w LEFT JOIN activity a ON a.pole=p.pole AND a.week=w.week ORDER BY w.week,p.pole`,[weeks]);
  return NextResponse.json({rows,weeks},{headers});
 }catch{return NextResponse.json({error:'Reporting des pôles indisponible.'},{status:503,headers})}
}
