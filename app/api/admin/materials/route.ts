import {NextRequest,NextResponse} from 'next/server';
import {currentMember} from '../../../../lib/session';
import {accessStatus} from '../../../../lib/access.mjs';
import {pool} from '../../../../lib/db';
import {ensureMaterials} from '../../../../lib/materials';
import {prepareMaterial,UploadError,MAX_PDF_BYTES,MAX_TRANSCRIPT_BYTES} from '../../../../lib/material-upload.mjs';
import presets from '../../../../content/formations.json';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(req:NextRequest){
 try{
  const member=await currentMember(req.headers),status=accessStatus(member,true);
  if(status!==200)return reply({error:status===401?'Connexion nécessaire.':'Accès réservé aux administrateurs.'},status);
  // A session alone is not CSRF protection: accept only this site's browser origin.
  if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Origine de la requête non autorisée.'},403);
  const length=Number(req.headers.get('content-length'));
  if(length>MAX_PDF_BYTES+MAX_TRANSCRIPT_BYTES+50000)return reply({error:'Fichiers trop volumineux. Maximum : 4 Mo par PDF.'},413);
  let form:FormData;try{form=await req.formData()}catch{return reply({error:'Envoi de fichiers invalide.'},400);}
  const file=form.get('pdf'),text=form.get('transcript');
  if(!(file instanceof File))return reply({error:'Sélectionnez un fichier PDF.'},400);
  if(file.size>MAX_PDF_BYTES)return reply({error:'Le PDF dépasse 4 Mo.'},413);
  if(text instanceof File&&text.size>MAX_TRANSCRIPT_BYTES)return reply({error:'La transcription est trop volumineuse.'},413);
  const value=(name:string)=>typeof form.get(name)==='string'?String(form.get(name)):'';
  const pdf=Buffer.from(await file.arrayBuffer());
  const input=await prepareMaterial(pdf,{mode:value('mode'),title:value('title'),description:value('description'),track:value('track'),filename:file.name,transcript:text instanceof File?await text.text():''},presets);
  await ensureMaterials();
  await pool!.query(`INSERT INTO jle_materials(id,pdf,transcript,sha256,metadata) VALUES($1,$2,COALESCE($3::jsonb,'{"pages":[]}'::jsonb),$4,$5::jsonb)
   ON CONFLICT(id) DO UPDATE SET pdf=EXCLUDED.pdf,transcript=COALESCE($3::jsonb,jle_materials.transcript),sha256=EXCLUDED.sha256,metadata=EXCLUDED.metadata,updated_at=NOW()`,[input.id,pdf,input.transcript?JSON.stringify(input.transcript):null,input.digest,input.metadata?JSON.stringify(input.metadata):null]);
  return reply({id:input.id,title:input.title,pages:input.pages});
 }catch(error){
  if(error instanceof UploadError)return reply({error:error.message},error.status);
  return reply({error:'Import impossible. Réessayez dans un instant.'},503);
 }
}
