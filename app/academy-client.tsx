'use client';
import {useState,useEffect,useCallback,useRef} from 'react';
import {createAuthClient} from 'better-auth/react';
import {BookOpen,LayoutDashboard,Target,ArrowUpRight,ArrowRight,UserRound,GraduationCap,LogOut,Layers,Menu,Network,ShieldCheck} from 'lucide-react';
import {useAcademyContent} from '../components/content-provider';
import PoleActivity from '../components/pole-activity';
import AccountSettings from '../components/account-settings';
import {Knowledge,Training,Progress,type Attempt} from '../components/academy';
import Flashcards from '../components/flashcards';
import Formations from '../components/formations';
import Processes from '../components/processes';
import Administration from '../components/admin';

import type {Formation} from '../lib/formation-types';
const auth=createAuthClient();
const modes=[{title:'Quiz express',tag:'10 QUESTIONS MAX',text:'Un petit rendez-vous pour entretenir vos connaissances.',icon:Target},{title:'Par thème',tag:'À VOTRE RYTHME',text:'Organisation, trésorerie : concentrez-vous sur un sujet.',icon:Layers},{title:'Examen blanc',tag:'30 QUESTIONS · 30 MIN',text:'Préparez le TAC1 avec un parcours complet et chronométré.',icon:GraduationCap}];
export default function Home({member}:{member:{id:string;name:string;siteRole:string;pole:string;post:string}}){
 const {formations:initialFormations}=useAcademyContent();
 const [tab,setTab]=useState('Tableau de bord'),[mobile,setMobile]=useState(false);
 const [attempts,setAttempts]=useState<Attempt[]>([]),[historyError,setHistoryError]=useState(''),[requested,setRequested]=useState<{mode:string;articleId?:string;formationId?:string;nonce:number}|null>(null);
 const [practice,setPractice]=useState('Tests'),[trainingChoice,setTrainingChoice]=useState('');
 const [trainingPhase,setTrainingPhase]=useState('setup'),[admin,setAdmin]=useState(member.siteRole==='admin'),[formationId,setFormationId]=useState('');
 const [flashRequest,setFlashRequest]=useState<{formationId:string;nonce:number}|null>(null);
 const [formations,setFormations]=useState<Formation[]>(initialFormations),[formationError,setFormationError]=useState('');
 const sessionState=auth.useSession();
 const session=(sessionState.isPending?{user:member}:sessionState.data) as {user:{id:string;name:string}} | null;
 const userId=session?.user.id;
 const currentUser=useRef(userId);currentUser.current=userId;
 const reload=useCallback(async()=>{if(!userId){setAttempts([]);return;}try{const r=await fetch('/api/attempts',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error);if(currentUser.current===userId){setAttempts(d.attempts);setHistoryError('');}}catch{if(currentUser.current===userId)setHistoryError('Impossible de charger votre historique.');}},[userId]);
 useEffect(()=>{setAttempts([]);setHistoryError('');let cancelled=false;if(userId)fetch('/api/attempts',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error();if(!cancelled)setAttempts(d.attempts)}).catch(()=>{if(!cancelled)setHistoryError('Impossible de charger votre historique.')});return()=>{cancelled=true}},[userId]);
 useEffect(()=>{let cancelled=false;setAdmin(false);if(userId)fetch('/api/account',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(!cancelled)setAdmin(Boolean(d?.isAdmin))}).catch(()=>{});return()=>{cancelled=true}},[userId]);
 const reloadFormations=useCallback(async()=>{if(!userId)return;try{const r=await fetch('/api/materials',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error();if(currentUser.current===userId){setFormations(d.formations);setFormationError('')}}catch{if(currentUser.current===userId)setFormationError('Impossible de charger les formations ajoutées.')}},[userId]);
 useEffect(()=>{setFormations(initialFormations);setFormationError('');void reloadFormations()},[reloadFormations]);
 const consume=useCallback(()=>setRequested(null),[]);
 function train(mode='Par thème',articleId='',formationId=''){setPractice('Tests');setTrainingChoice(mode);setRequested({mode,articleId,formationId,nonce:Date.now()});setTab('Entraînements');}
 useEffect(()=>{if(!sessionState.isPending&&!sessionState.data)window.location.replace('/')},[sessionState.isPending,sessionState.data]);
 function login(){window.location.assign('/')}
 return <div className="shell"><aside className={mobile?'sidebar visible':'sidebar'}><a href="/" className="brand"><img src="https://junia-lille-etudes.odoo.com/web/image/website/1/logo" alt="Junia Lille Études"/><span>ACADÉMIE JLE</span></a><div className="nav-label">VOTRE ESPACE</div><nav>{[[LayoutDashboard,'Tableau de bord'],[BookOpen,'Connaissances'],[Target,'Entraînements'],[Network,'Process'],[GraduationCap,'Formations'],[UserRound,'Mon compte'],...(admin?[[ShieldCheck,'Administration']]:[])].map(([Icon,label]:any)=><button key={label} className={tab===label?'active':''} onClick={()=>{setTab(label);setMobile(false)}}><Icon size={19}/>{label}</button>)}</nav><div className="sidebar-bottom"><div className="help"><GraduationCap size={24}/><h3>Un cap : le TAC1.</h3><p>Les bons réflexes se construisent un peu chaque jour.</p><button onClick={()=>{setTab('Entraînements');setMobile(false)}}>Voir les parcours</button></div><small>JUNIA LILLE ÉTUDES<br/><span>Vos projets, nos compétences.</span></small></div></aside>
 <div className="workspace"><header><button className="mobile-toggle" aria-label="Ouvrir le menu" onClick={()=>setMobile(!mobile)}><Menu/></button><span>Académie JLE <span className="slash">/</span> <strong>{tab}</strong></span><div className="header-right">{session?<button className="account" onClick={async()=>{await auth.signOut();window.location.replace('/')}}><LogOut size={16}/>Déconnexion</button>:<button className="account" onClick={login}>Se connecter <ArrowUpRight size={16}/></button>}</div></header>
 <main><div className="page-heading"><h1>{tab}</h1></div>
 {tab==='Tableau de bord'&&<PoleActivity/>}
 {tab==='Entraînements'&&(practice==='Flashcards'||trainingPhase!=='active')&&<div className="segmented practice-tabs" role="group" aria-label="Mode d’entraînement">{['Tests','Flashcards'].map(value=><button key={value} className={practice===value?'active':''} onClick={()=>setPractice(value)}>{value}</button>)}</div>}
 {tab==='Entraînements'&&practice==='Tests'&&trainingPhase==='setup'&&<div className="modes training-modes">{modes.map((mode,i)=><button className={'mode '+(trainingChoice===mode.title?'chosen':'')} aria-pressed={trainingChoice===mode.title} key={mode.title} onClick={()=>train(mode.title)}><div className={'mode-icon color'+i}><mode.icon size={24}/></div><small>{mode.tag}</small><h3>{mode.title}</h3><p>{mode.text}</p></button>)}</div>}
 {tab==='Connaissances'&&<><div className="section-title"><h2>La bibliothèque de votre Junior</h2></div><Knowledge formations={formations} compact={false} onTrain={id=>train('Par thème',id)} onFormation={id=>{setFormationId(id);setTab('Formations')}}/></>}
 <div hidden={tab!=='Entraînements'||practice!=='Tests'||!trainingChoice}><Training userId={userId} attempts={attempts} onSaved={reload} requested={requested} onConsumed={consume} onLogin={login} onPhase={setTrainingPhase}/></div>
 <div hidden={tab!=='Entraînements'||practice!=='Flashcards'}><Flashcards requested={flashRequest} onConsumed={()=>setFlashRequest(null)}/></div>
 {tab==='Process'&&<Processes/>}
 {tab==='Formations'&&<>{formationError&&<div className="notice" role="alert">{formationError} <button className="text-button" onClick={reloadFormations}>Réessayer</button></div>}<Formations onTrain={id=>train('Par formation','',id)} onFlashcards={id=>{setFlashRequest({formationId:id,nonce:Date.now()});setPractice('Flashcards');setTab('Entraînements')}} formations={formations} userId={userId} initialId={formationId} onLogin={login}/></>}
 {tab==='Administration'&&(admin?<Administration key={userId} formations={formations} onImported={reloadFormations}/>:<section className="library empty"><h2>Accès réservé aux administrateurs</h2><p>Connectez-vous avec un compte autorisé.</p></section>)}
 {tab==='Mon compte'&&<Progress attempts={attempts} userId={userId} error={historyError} reload={reload} onMistakes={()=>train('Mes erreurs')} onLogin={login}/>}

 {tab==='Mon compte'&&userId&&<AccountSettings pole={member.pole} post={member.post}/>}
 {tab==='Mon compte'&&userId&&<p className="fineprint account-id">Mon identifiant de compte : <code>{userId}</code></p>}
 </main></div>
 </div>;
}
