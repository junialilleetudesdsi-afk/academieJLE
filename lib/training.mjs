export const MODES = ['Quiz express', 'Par thème', 'Examen blanc', 'Mes erreurs'];
export function shuffle(items, random = Math.random) {
 const copy = [...items];
 for (let i=copy.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; }
 return copy;
}
// Prefer distinct skills within a session; reuse variants only if the selected pool is small.
function distinctFirst(items, key) {
 const seen=new Set(), first=[], repeats=[];
 for (const item of items) {
  const value=key(item);
  if(seen.has(value)) repeats.push(item);
  else { seen.add(value); first.push(item); }
 }
 return [...first,...repeats];
}
export function selectQuestions(questions, mode, track='Tous les thèmes', articleId='', wrongIds=[]) {
 if (!MODES.includes(mode)) throw new Error('Mode inconnu');
 let pool=questions.filter(q=>q.status==='verified');
 if (mode==='Examen blanc') {
  return shuffle(['Organisation','Trésorerie'].flatMap(t=>distinctFirst(shuffle(pool.filter(q=>q.track===t)),q=>q.articleId).slice(0,15)));
 }
 if(mode==='Mes erreurs') pool=pool.filter(q=>wrongIds.includes(q.id));
 if(track!=='Tous les thèmes') pool=pool.filter(q=>q.track===track);
 if(articleId) pool=pool.filter(q=>q.articleId===articleId);
 return distinctFirst(shuffle(pool),q=>q.family??q.id).slice(0,10);
}
export function grade(questions, entries) {
 if(!Array.isArray(entries)||entries.length<1||entries.length>100) throw new Error('Liste de réponses invalide');
 const seen=new Set();
 const results=entries.map(entry=>{
  if(!entry||typeof entry.questionId!=='string'||seen.has(entry.questionId)) throw new Error('Question dupliquée ou invalide');
  seen.add(entry.questionId);
  const q=questions.find(q=>q.id===entry.questionId&&q.status==='verified');
  if(!q) throw new Error('Question inconnue');
  if(entry.answer!==null && !q.options.some(o=>o.id===entry.answer)) throw new Error('Réponse inconnue');
  return {questionId:q.id,answer:entry.answer,correct:entry.answer===q.correctAnswer,track:q.track};
 });
 return {score:results.filter(r=>r.correct).length,total:results.length,results};
}
export function validateAttempt(questions, body) {
 if(!body || typeof body.id!=='string'|| !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) throw new Error('Identifiant invalide');
 if(!MODES.includes(body.mode)) throw new Error('Mode inconnu');
 if(!Number.isInteger(body.duration)||body.duration<0||body.duration>86400) throw new Error('Durée invalide');
 const result=grade(questions,body.entries);
 const limit=body.mode==='Examen blanc'?30:10;
 if(result.total>limit) throw new Error('Trop de questions');
 if(body.mode==='Examen blanc'&&(result.total!==30 || result.results.filter(r=>r.track==='Organisation').length!==15)) throw new Error('Examen déséquilibré');
 return {id:body.id,mode:body.mode,duration:body.duration,...result};
}
