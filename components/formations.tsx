'use client';
import {useAcademyContent} from './content-provider';
import {useEffect,useState} from 'react';
import {BookOpen,Download,ExternalLink,Search} from 'lucide-react';
import type {Formation} from '../lib/formation-types';

type Props={userId?:string;onLogin:()=>void;initialId?:string};
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function FormationReader({item,userId,onLogin}:Props&{item:Formation}){
 const {catalog}=useAcademyContent();
 const [error,setError]=useState(''),[available,setAvailable]=useState(false),[checking,setChecking]=useState(true),[retry,setRetry]=useState(0);
 useEffect(()=>{if(!userId)return;const controller=new AbortController();setAvailable(false);setChecking(true);setError('');fetch('/api/materials/'+item.id+'?format=status',{signal:controller.signal,cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);if(!controller.signal.aborted)setAvailable(true)}).catch(e=>{if(!controller.signal.aborted)setError(e.message||'Support indisponible.')}).finally(()=>{if(!controller.signal.aborted)setChecking(false)});return()=>controller.abort()},[item.id,userId,retry]);
 if(!userId)return <div className="library empty"><BookOpen size={28}/><h3>Formation interne JLE</h3><p>Connectez-vous pour consulter le support complet.</p><button className="primary" onClick={onLogin}>Se connecter</button></div>;
 if(checking)return <p role="status">Vérification du support…</p>;
 if(!available)return <div className="notice" role="status"><p>{error||'Ce support attend son import par le gestionnaire du site.'}</p><button className="secondary" onClick={()=>setRetry(retry+1)}>Réessayer</button></div>;
 return <section className="formation-reader"><div className="reader-toolbar"><a href={'/api/materials/'+item.id+'?download=1'} className="secondary">Télécharger <Download size={15}/></a><a href={'/api/materials/'+item.id} target="_blank" rel="noreferrer" className="secondary">Ouvrir le PDF <ExternalLink size={15}/></a></div><object key={item.id} data={'/api/materials/'+item.id+'#view=FitH'} type="application/pdf" className="pdf-viewer" aria-label={'PDF '+item.title}><p>Votre navigateur ne peut pas afficher le PDF intégré. Utilisez « Ouvrir le PDF » ou « Télécharger » pour le consulter.</p></object>{item.related.length>0&&<><h3>Fiches associées</h3><div className="related-links">{item.related.map(id=>{const a=catalog.articles.find(a=>a.id===id);return a?<a key={id} target="_blank" rel="noreferrer" href={a.source.url}>{a.title} <ExternalLink size={13}/></a>:null})}</div></>}</section>
}
export default function Formations(props:Props&{formations:Formation[];onTrain:(id:string)=>void;onFlashcards:(id:string)=>void}){
 const {catalog}=useAcademyContent();
 const formations=props.formations;
 const [query,setQuery]=useState(''),[track,setTrack]=useState('Tous les thèmes'),[selected,setSelected]=useState<Formation|null>(()=>formations.find(f=>f.id===props.initialId)??null);
 useEffect(()=>{if(props.initialId)setSelected(formations.find(f=>f.id===props.initialId)??null)},[props.initialId,formations]);
 if(selected)return <><button className="secondary" onClick={()=>setSelected(null)}>Toutes les formations</button><div className="section-title"><div><span className="eyebrow">FORMATION INTERNE</span><h2>{selected.title}</h2></div><span>{selected.pages} pages</span></div><p>{selected.description}</p>{catalog.questions.some(q=>'formationId' in q&&q.formationId===selected.id)&&<section className="formation-practice"><div><strong>Réviser cette formation</strong><p>{catalog.questions.filter(q=>'formationId' in q&&q.formationId===selected.id).length} questions avec corrigés et pages sources.</p></div><button className="primary" onClick={()=>props.onTrain(selected.id)}>Quiz sur cette formation</button><button className="secondary" onClick={()=>props.onFlashcards(selected.id)}>Flashcards de cette formation</button></section>}<FormationReader key={props.userId+'-'+selected.id} item={selected} {...props}/></>;
 const list=formations.filter(f=>(track==='Tous les thèmes'||f.track===track)&&norm(f.title+' '+f.description).includes(norm(query)));
 return <><section className="library"><div className="search-row"><label className="search"><Search size={18}/><input aria-label="Rechercher une formation" placeholder="Rechercher une formation…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select value={track} aria-label="Domaine de formation" onChange={e=>setTrack(e.target.value)}>{['Tous les thèmes','Organisation','Trésorerie'].map(t=><option key={t}>{t}</option>)}</select></div><div className="article-grid">{list.map(f=><button key={f.id} className="article-card" onClick={()=>setSelected(f)}><span className="subtle-tag">{f.track} · {f.pages} pages</span><h3>{f.title}</h3><p>{f.description}</p><span className="card-link">Consulter la formation <BookOpen size={16}/></span></button>)}</div>{!list.length&&<p className="empty">Aucune formation correspondante.</p>}</section></>
}
