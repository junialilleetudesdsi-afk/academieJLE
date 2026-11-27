'use client';
import type {Question,Article} from '../lib/content-types';
import {useAcademyContent} from './content-provider';



type QuestionRef={articleId:string;formationId?:string;formationPage?:number;kiwiVerified?:boolean;formationCheckedAt?:string};
const date=(s:string)=>new Date(s+'T12:00:00').toLocaleDateString('fr-FR');
export function Source({article,checkedAt}:{article:Article;checkedAt?:string}){return <div className="source"><a href={article.source.url} target="_blank" rel="noreferrer">Kiwi Légal · {article.source.title} ↗</a><small>Fiche source mise à jour le {date(article.source.updated)} · vérifiée le {date(checkedAt??article.source.checkedAt)}</small></div>}
export function QuestionSource({question}:{question:QuestionRef}){
 const {catalog,formations}=useAcademyContent();
 const formation=formations.find(f=>f.id===question.formationId),article=catalog.articles.find(a=>a.id===question.articleId);
 return <>{formation&&<div className="source"><a href={'/api/materials/'+formation.id+'#page='+question.formationPage} target="_blank" rel="noreferrer">Formation JLE · {formation.title} · page {question.formationPage}</a><small>Support PDF accessible après connexion.{question.formationCheckedAt?' Question préparée le '+date(question.formationCheckedAt)+'.':''}</small></div>}{article&&(!formation||question.kiwiVerified)&&<Source article={article} checkedAt={formation?question.formationCheckedAt:undefined}/>}</>
}
