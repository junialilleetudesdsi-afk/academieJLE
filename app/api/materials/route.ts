import {NextRequest,NextResponse} from 'next/server';
import {currentMember} from '../../../lib/session';
import {pool} from '../../../lib/db';
import {ensureMaterials} from '../../../lib/materials';
import presets from '../../../content/formations.json';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:NextRequest){
 try{
  if(!await currentMember(req.headers))return NextResponse.json({error:'Connexion nécessaire.'},{status:401,headers});
  await ensureMaterials();
  const {rows}=await pool!.query("SELECT id,metadata,jsonb_array_length(COALESCE(transcript->'pages','[]'::jsonb))>0 AS \"hasTranscript\" FROM jle_materials ORDER BY updated_at DESC,id");
  const predefined=presets.map(f=>{const row=rows.find(r=>r.id===f.id);return {...f,ready:Boolean(row),hasTranscript:Boolean(row?.hasTranscript)}});
  const custom=rows.filter(r=>!presets.some(f=>f.id===r.id)&&r.metadata).map(r=>({...r.metadata,id:r.id,ready:true,hasTranscript:r.hasTranscript}));
  return NextResponse.json({formations:[...predefined,...custom]},{headers});
 }catch{return NextResponse.json({error:'Impossible de charger les formations.'},{status:503,headers});}
}
