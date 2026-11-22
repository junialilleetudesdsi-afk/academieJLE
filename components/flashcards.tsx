'use client';
import {useEffect,useRef,useState} from 'react';
import {BookOpen,RotateCcw,Layers} from 'lucide-react';
import catalog from '../content/catalog.json';
import {shuffle} from '../lib/training.mjs';
import {Source} from './academy';
type Question=typeof catalog.questions[number];
export default function Flashcards(){
 const [track,setTrack]=useState('Tous les thèmes'),[topic,setTopic]=useState(''),[size,setSize]=useState(20),[deck,setDeck]=useState<Question[]>([]),[index,setIndex]=useState(0),[flipped,setFlipped]=useState(false),[answers,setAnswers]=useState<Record<string,boolean>>({}),[error,setError]=useState('');
 const flipButton=useRef<HTMLButtonElement>(null);
 const active=deck.length>0&&index<deck.length;
 useEffect(()=>{if(active)flipButton.current?.focus()},[active,index]);
 function start(ids?:string[]){
  const pool=catalog.questions.filter(q=>q.status==='verified'&&(ids?ids.includes(q.id):(track==='Tous les thèmes'||q.track===track)&&(!topic||q.articleId===topic)));
  const selected=shuffle(pool).slice(0,ids?pool.length:size);
  if(!selected.length){setError('Aucune carte pour cette sélection.');return;}
  setDeck(selected);setIndex(0);setFlipped(false);setAnswers({});setError('');
 }
 function rate(value:boolean){const q=deck[index];setAnswers({...answers,[q.id]:value});setFlipped(false);setIndex(index+1);}
 if(active){
  const q=deck[index],article=catalog.articles.find(a=>a.id===q.articleId)!;
  return <section className="flash-workspace"><div className="section-title"><h2>Carte {index+1} / {deck.length}</h2><span>{q.track}</span></div><progress value={index} max={deck.length}/><button ref={flipButton} className={'flashcard '+(flipped?'flipped':'')} aria-label={flipped?'Revoir la question':'Retourner la carte pour voir la réponse'} onClick={()=>setFlipped(!flipped)}><span className="eyebrow">{flipped?'LA RÉPONSE':'LA QUESTION'}</span><strong>{flipped?q.options.find(o=>o.id===q.correctAnswer)?.text:q.prompt}</strong>{flipped&&<span className="flash-explanation">{q.explanation}</span>}<span className="flash-hint">{flipped?'Cliquez pour revoir la question':'Répondez de mémoire, puis cliquez pour retourner'}</span></button>{flipped&&<><Source article={article}/><div className="flash-ratings"><button className="secondary" onClick={()=>rate(false)}>À revoir</button><button className="primary" onClick={()=>rate(true)}>Je savais</button></div></>}<button className="text-button" onClick={()=>{if(window.confirm('Quitter cette session de flashcards ?')){setDeck([]);setAnswers({})}}}>Quitter la session</button><p className="fineprint">Auto-évaluation de cette session uniquement. Elle n’est pas enregistrée comme un résultat de test.</p></section>
 }
 if(deck.length){const good=Object.values(answers).filter(Boolean).length,bad=Object.keys(answers).filter(id=>!answers[id]);return <section className="library setup"><Layers size={32}/><h2>Votre série est terminée.</h2><div className="result-score">{good}<span> / {deck.length} maîtrisées</span></div><p>{bad.length} carte(s) à retravailler selon votre auto-évaluation.</p><div className="quiz-actions">{bad.length>0&&<button className="primary" onClick={()=>start(bad)}>Revoir ces {bad.length} cartes</button>}<button className="secondary" onClick={()=>{setDeck([]);setAnswers({})}}>Nouvelle série</button></div></section>}
 return <section className="library setup"><BookOpen size={32}/><h2>Le bon réflexe, de mémoire.</h2><p>Une question au recto, sa réponse expliquée au verso. Travaillez les {catalog.questions.length} questions de la banque à votre rythme.</p><div className="setup-fields"><label>Domaine<select value={track} onChange={e=>{setTrack(e.target.value);setTopic('')}}>{['Tous les thèmes','Organisation','Trésorerie'].map(t=><option key={t}>{t}</option>)}</select></label><label>Fiche<select value={topic} onChange={e=>setTopic(e.target.value)}><option value="">Toutes les fiches</option>{catalog.articles.filter(a=>track==='Tous les thèmes'||a.track===track).map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select></label><label>Nombre de cartes<select value={size} onChange={e=>setSize(Number(e.target.value))}>{[10,20,50,100,500].map(n=><option key={n} value={n}>{n===500?'Toutes les cartes':n+' cartes'}</option>)}</select></label></div><p className="fineprint">La série s’adapte au nombre de cartes disponibles dans votre sélection. Pas de chronomètre.</p>{error&&<p role="alert">{error}</p>}<button className="primary" onClick={()=>start()}>Commencer les flashcards <RotateCcw size={16}/></button></section>
}
