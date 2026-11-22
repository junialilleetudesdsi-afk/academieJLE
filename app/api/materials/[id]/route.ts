import {NextRequest,NextResponse} from 'next/server';
import {currentMember} from '../../../../lib/session';
import {pool} from '../../../../lib/db';
import {ensureMaterials} from '../../../../lib/materials';
import materials from '../../../../content/formations.json';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest,ctx:{params:Promise<{id:string}>}){
 const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN'};
 try{
  if(!await currentMember(req.headers))return NextResponse.json({error:'Connectez-vous pour consulter les formations internes.'},{status:401,headers});
  const {id}=await ctx.params,material=materials.find(m=>m.id===id);
  if(!material)return NextResponse.json({error:'Formation introuvable.'},{status:404,headers});
  await ensureMaterials();
  const text=req.nextUrl.searchParams.get('format')==='text',status=req.nextUrl.searchParams.get('format')==='status';
  const {rows}=await pool!.query(status?'SELECT sha256 FROM jle_materials WHERE id=$1':text?'SELECT transcript FROM jle_materials WHERE id=$1':'SELECT pdf FROM jle_materials WHERE id=$1',[material.id]);
  if(!rows.length)return NextResponse.json({error:'Ce support n’a pas encore été importé par le gestionnaire du site.'},{status:503,headers});
  if(status)return NextResponse.json({ready:true},{headers});
  if(text)return NextResponse.json(rows[0].transcript,{headers});
  const data=rows[0].pdf as Buffer;
  return new NextResponse(new Uint8Array(data),{headers:{...headers,'Content-Type':'application/pdf','Content-Length':String(data.byteLength),'Content-Disposition':(req.nextUrl.searchParams.get('download')==='1'?'attachment':'inline')+`; filename="JLE-${id}.pdf"`}});
 }catch{return NextResponse.json({error:'Document indisponible. Réessayez dans un instant.'},{status:503,headers});}
}
