import {NextRequest,NextResponse} from 'next/server';
import {currentMember} from '../../../lib/session';

export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 try{const member=await currentMember(req.headers);return NextResponse.json(member?{id:member.id,isAdmin:member.siteRole==='admin',pole:member.pole,post:member.post}:{id:null,isAdmin:false},{headers:{'Cache-Control':'private, no-store'}});}
 catch{return NextResponse.json({error:'Compte indisponible.'},{status:503,headers:{'Cache-Control':'private, no-store'}});}
}
