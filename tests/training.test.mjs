import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {grade,selectQuestions,validateAttempt} from '../lib/training.mjs';
const catalog=JSON.parse(readFileSync(new URL('../content/catalog.json',import.meta.url),'utf8'));
const questions=catalog.questions;
test('Catalogue : identifiants uniques, quatre choix distincts, une réponse et une source pour chaque question',()=>{
 assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
 assert.equal(new Set(questions.map(q=>q.prompt)).size,questions.length);
 assert.equal(new Set(catalog.articles.map(a=>a.id)).size,catalog.articles.length);
 for(const q of questions){assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(o=>o.text)).size,4);assert.equal(q.options.filter(o=>o.id===q.correctAnswer).length,1);assert.ok(q.explanation.length>30);assert.ok(q.origin);const article=catalog.articles.find(a=>a.id===q.articleId);assert.ok(article);assert.equal(q.track,article.track);assert.match(article.source.url,/^https:\/\/legal.junior-entreprises.com\/a\//);assert.ok(article.source.updated<=article.source.checkedAt);}
});
test('Examen : 30 questions distinctes avec 15 questions par domaine',()=>{
 for(let i=0;i<30;i++){const selected=selectQuestions(questions,'Examen blanc');assert.equal(selected.length,30);assert.equal(new Set(selected.map(q=>q.id)).size,30);assert.equal(selected.filter(q=>q.track==='Organisation').length,15);assert.equal(selected.filter(q=>q.track==='Trésorerie').length,15);}
});
test('Filtres par domaine, fiche et erreurs sans inventer de questions',()=>{
 const chosen=selectQuestions(questions,'Par thème','Organisation','esign');assert.ok(chosen.length>0);assert.ok(chosen.every(q=>q.articleId==='esign'&&q.track==='Organisation'));
 assert.deepEqual(selectQuestions(questions,'Mes erreurs','Tous les thèmes','',[]),[]);
 assert.equal(selectQuestions(questions,'Mes erreurs','Tous les thèmes','',[questions[0].id])[0].id,questions[0].id);
 assert.deepEqual(selectQuestions(questions,'Par thème','Trésorerie','esign'),[]);
});
test('Notation : une bonne, une mauvaise, une absence = un point, sans confiance dans un score fourni',()=>{
 const entries=questions.slice(0,3).map((q,i)=>({questionId:q.id,answer:i===0?q.correctAnswer:i===1?q.options.find(o=>o.id!==q.correctAnswer).id:null}));
 assert.equal(grade(questions,entries).score,1);
 const result=validateAttempt(questions,{id:'12345678-1234-1234-1234-123456789abc',mode:'Quiz express',duration:30,entries,score:999});assert.equal(result.score,1);
});
test('Rejette les questions dupliquées, inconnues, réponses inexistantes et formats corrompus',()=>{
 const entry={questionId:questions[0].id,answer:questions[0].correctAnswer};
 for(const entries of [[entry,entry],[{questionId:'fake',answer:'a'}],[{...entry,answer:'z'}],[{...entry,answer:undefined}],[],null]) assert.throws(()=>grade(questions,entries));
 const base={id:'12345678-1234-1234-1234-123456789abc',mode:'Quiz express',duration:30,entries:[entry]};
 for(const change of [{id:'wrong'},{mode:'fake'},{duration:-1},{duration:0.2},{duration:86401},{mode:'Examen blanc'}])assert.throws(()=>validateAttempt(questions,{...base,...change}));
});
test('Un examen complet est validé et noté sur trente',()=>{const entries=selectQuestions(questions,'Examen blanc').map(q=>({questionId:q.id,answer:q.correctAnswer}));assert.equal(validateAttempt(questions,{id:'12345678-1234-1234-1234-123456789abc',mode:'Examen blanc',duration:1800,entries}).score,30)});
