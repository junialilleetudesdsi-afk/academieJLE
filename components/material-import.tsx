'use client';
import {useRef,useState} from 'react';
import {Upload,CheckCircle,FileText} from 'lucide-react';
import presets from '../content/formations.json';
import type {Formation} from '../lib/formation-types';

type Outcome={name:string;ok:boolean;message:string};
type Props={formations:Formation[];onImported:()=>Promise<void>};
const MAX_PDF=4_000_000;
export default function MaterialImport({formations,onImported}:Props){
 const [mode,setMode]=useState('prepared'),[files,setFiles]=useState<File[]>([]),[pdf,setPdf]=useState<File|null>(null),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[track,setTrack]=useState('Organisation'),[busy,setBusy]=useState(false),[outcomes,setOutcomes]=useState<Outcome[]>([]),[progress,setProgress]=useState('');
 const newInput=useRef<HTMLInputElement>(null);
 async function send(file:File,fields:Record<string,string>,transcript?:File){
  if(file.size>MAX_PDF)throw new Error('PDF supérieur à 4 Mo : réduisez sa taille avant l’import.');
  const form=new FormData();form.set('pdf',file);for(const [key,value] of Object.entries(fields))form.set(key,value);
  if(transcript)form.set('transcript',transcript);
  const response=await fetch('/api/admin/materials',{method:'POST',body:form});
  let data;try{data=await response.json()}catch{throw new Error('Import interrompu. Vérifiez la taille du fichier et réessayez.')}
  if(!response.ok)throw new Error(data.error||'Import impossible.');
  return data as {title:string;pages:number};
 }
 async function importPrepared(){
  setBusy(true);setOutcomes([]);let count=0;
  const pdfs=files.filter(f=>/\.pdf$/i.test(f.name));
  for(let i=0;i<pdfs.length;i++){
   const file=pdfs[i];setProgress(`Import ${i+1} / ${pdfs.length} : ${file.name}`);
   try{
    if(file.size>MAX_PDF)throw new Error('PDF supérieur à 4 Mo. Utilisez la version du lot préparé.');
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).map(n=>n.toString(16).padStart(2,'0')).join('');
    const item=presets.find(f=>f.sha256===hash);
    if(!item)throw new Error('PDF absent du lot préparé. Utilisez « Nouvelle formation ».');
    const transcript=files.find(f=>f.name.toLowerCase()===item.id+'.json');
    const data=await send(file,{mode:'prepared'},transcript);count++;
    setOutcomes(previous=>[...previous,{name:file.name,ok:true,message:`${data.title} · ${data.pages} pages${transcript?' · PDF et texte':' · PDF'}`}]);
   }catch(error){setOutcomes(previous=>[...previous,{name:file.name,ok:false,message:error instanceof Error?error.message:'Import impossible.'}])}
  }
  if(count)await onImported();setProgress('');setBusy(false);
 }
 async function importNew(e:React.FormEvent){
  e.preventDefault();if(!pdf)return;setBusy(true);setOutcomes([]);setProgress('Import de '+pdf.name+'…');
  try{
   const data=await send(pdf,{mode:'new',title,description,track});
   setOutcomes([{name:pdf.name,ok:true,message:`${data.title} · ${data.pages} pages · Formation disponible`}]);
   await onImported();setPdf(null);setTitle('');setDescription('');if(newInput.current)newInput.current.value='';
  }catch(error){setOutcomes([{name:pdf.name,ok:false,message:error instanceof Error?error.message:'Import impossible.'}])}
  finally{setProgress('');setBusy(false)}
 }
 return <><section className="library material-import"><div className="section-title"><h2><Upload size={20}/> Importer des formations</h2></div><div className="segmented import-modes"><button disabled={busy} className={mode==='prepared'?'active':''} onClick={()=>{setMode('prepared');setOutcomes([])}}>Supports JLE préparés</button><button disabled={busy} className={mode==='new'?'active':''} onClick={()=>{setMode('new');setOutcomes([])}}>Nouvelle formation</button></div>
 {mode==='prepared'?<div className="import-form"><p>Extrayez le ZIP des formations, puis sélectionnez les fichiers PDF et JSON du dossier. Les supports sont reconnus automatiquement.</p><label>Fichiers à importer<input type="file" multiple accept=".pdf,.json,application/pdf,application/json" disabled={busy} onChange={e=>{setFiles(Array.from(e.target.files??[]));setOutcomes([])}}/></label><p className="fineprint">{files.filter(f=>/\.pdf$/i.test(f.name)).length} PDF sélectionné(s). Les fichiers JSON ajoutent la lecture texte. Limite : 4 Mo par PDF.</p><button className="primary" disabled={busy||!files.some(f=>/\.pdf$/i.test(f.name))} onClick={importPrepared}>{busy?'Import en cours…':'Importer les supports'}</button></div>:<form className="import-form" onSubmit={importNew}><label>PDF · 4 Mo maximum<input ref={newInput} type="file" accept=".pdf,application/pdf" required disabled={busy} onChange={e=>{const file=e.target.files?.[0]??null;setPdf(file);setOutcomes([]);if(file&&!title)setTitle(file.name.replace(/\.pdf$/i,'').slice(0,160))}}/></label><label>Titre<input required minLength={3} maxLength={160} value={title} disabled={busy} onChange={e=>setTitle(e.target.value)}/></label><label>Thème<select value={track} disabled={busy} onChange={e=>setTrack(e.target.value)}><option>Organisation</option><option>Trésorerie</option></select></label><label>Description<textarea rows={3} maxLength={2000} value={description} disabled={busy} onChange={e=>setDescription(e.target.value)} placeholder="Contenu et objectifs de la formation"/></label><p className="fineprint">Le PDF sera consultable dans Formations. Le titre et la description apparaîtront aussi dans Connaissances.</p><button className="primary" disabled={busy||!pdf}>{busy?'Import en cours…':'Ajouter la formation'}</button></form>}
 <div className="import-results" aria-live="polite">{progress&&<p>{progress}</p>}{outcomes.map((result,i)=><div className={result.ok?'import-result success':'import-result failure'} key={i}>{result.ok?<CheckCircle size={19}/>:<FileText size={19}/>}<div><strong>{result.name}</strong><p>{result.message}</p></div></div>)}</div></section><section className="library material-list"><h2>Supports du site</h2>{formations.map(f=><div key={f.id}><span><strong>{f.title}</strong><small>{f.track} · {f.pages} pages</small></span><span className={f.ready?'material-ready':'material-pending'}>{f.ready?'Importé':f.ready===false?'À importer':'État à vérifier'}</span></div>)}</section></>
}
