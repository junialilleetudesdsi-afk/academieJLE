import {NextRequest,NextResponse} from 'next/server';
import {currentMember} from '../../../../lib/session';
import {pool,ensureAttempts} from '../../../../lib/db';
import {ensureMembers} from '../../../../lib/membership';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:NextRequest){
 try{
  if(!await currentMember(req.headers))return NextResponse.json({error:'Connexion nécessaire.'},{status:401,headers});
  await ensureMembers();await ensureAttempts();
  const {rows}=await pool!.query(`WITH counts AS (
   SELECT m.pole,count(a.id)::int AS tests FROM jle_members m LEFT JOIN jle_attempts a ON a.user_id=m.user_id AND a.created_at>=NOW()-INTERVAL '30 days' AND a.created_at<=NOW() GROUP BY m.pole
  ) SELECT pole,tests,CASE WHEN tests>0 THEN rank() OVER(ORDER BY tests DESC)::int ELSE NULL END AS rank,
   count(*) OVER(PARTITION BY tests)::int AS tied FROM counts ORDER BY tests DESC,pole LIMIT 3`);
  return NextResponse.json({poles:rows},{headers});
 }catch{return NextResponse.json({error:'Classement indisponible.'},{status:503,headers})}
}
