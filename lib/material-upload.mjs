import {createHash} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';

export const MAX_PDF_BYTES=4_000_000;
export const MAX_TRANSCRIPT_BYTES=250_000;
export class UploadError extends Error {
 constructor(message,status=400){super(message);this.status=status;}
}
export function parseTranscript(raw,pages){
 if(!raw)return null;
 if(Buffer.byteLength(raw)>MAX_TRANSCRIPT_BYTES)throw new UploadError('La transcription est trop volumineuse.',413);
 let data;try{data=JSON.parse(raw)}catch{throw new UploadError('Fichier de transcription JSON invalide.')}
 if(!Array.isArray(data?.pages)||data.pages.length!==pages||data.pages.some((p,i)=>p?.number!==i+1||typeof p.text!=='string'||p.text.length>20000))throw new UploadError('La transcription doit correspondre aux pages du PDF.');
 return {pages:data.pages.map(p=>({number:p.number,text:p.text}))};
}
export async function prepareMaterial(pdf,fields,presets){
 if(pdf.length>MAX_PDF_BYTES)throw new UploadError('Le PDF dépasse 4 Mo. Réduisez sa taille avant de l’importer.',413);
 if(pdf.length<8||pdf.subarray(0,5).toString()!=='%PDF-')throw new UploadError('Sélectionnez un fichier PDF valide.');
 const digest=createHash('sha256').update(pdf).digest('hex');
 const known=presets.find(f=>f.sha256===digest);
 if(fields.mode==='prepared'&&!known)throw new UploadError('PDF non reconnu dans le lot JLE préparé. Utilisez « Nouvelle formation » pour un autre support.');
 if(known)return {id:known.id,digest,metadata:null,transcript:parseTranscript(fields.transcript,known.pages),title:known.title,pages:known.pages};
 const title=(fields.title??'').trim(),description=(fields.description??'').trim(),track=fields.track;
 if(title.length<3||title.length>160)throw new UploadError('Le titre doit contenir entre 3 et 160 caractères.');
 if(description.length>2000)throw new UploadError('La description est limitée à 2 000 caractères.');
 if(!['Organisation','Trésorerie'].includes(track))throw new UploadError('Choisissez un thème valide.');
 let document;try{document=await PDFDocument.load(pdf,{updateMetadata:false,throwOnInvalidObject:true})}catch{throw new UploadError('PDF illisible ou protégé par un mot de passe. Exportez une copie PDF non protégée.');}
 const pages=document.getPageCount();
 if(pages<1||pages>500)throw new UploadError('Le support doit contenir entre 1 et 500 pages.');
 const id='uploaded-'+digest;
 const metadata={id,title,description,track,pages,notice:'',year:null,related:[],sections:description?[{title:'Présentation',body:description}]:[],sha256:digest,originalName:(fields.filename??'formation.pdf').slice(0,200),optimizedForWeb:false};
 return {id,digest,metadata,transcript:parseTranscript(fields.transcript,pages),title,pages};
}
