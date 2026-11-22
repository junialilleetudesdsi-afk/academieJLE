import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import * as access from '../lib/access.mjs';
import * as upload from '../lib/material-upload.mjs';
import {PDFDocument} from 'pdf-lib';
class NextResponse extends Response {static json(value,options){return new NextResponse(JSON.stringify(value),{...options,headers:{'Content-Type':'application/json',...options?.headers}})}}
function loadRoute(path,mocks){
 const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const js=stripTypeScriptTypes(source,{mode:'strip'}).replace(/^import .*;$/gm,'').replace(/export /g,'');
 const context=vm.createContext({NextResponse,...Object.assign({},...Object.values(mocks)),path:mocks['node:path'],materials:mocks['../../../../content/formations.json'],presets:[],...access,...upload,process,Response,Headers,Buffer,URL,File,FormData,console});
 return vm.runInContext('(()=>{'+js+';return {GET:typeof GET==="undefined"?undefined:GET,POST:typeof POST==="undefined"?undefined:POST};})()',context);
}
const request=url=>({headers:new Headers(),nextUrl:new URL(url)});
test('API admin : 401 et 403 empêchent toute lecture de la base',async()=>{
 for(const member of [null,{id:'not-admin',role:'admin'}]){
  let queries=0;
  const route=loadRoute('app/api/admin/route.ts',{'../../../lib/session':{currentMember:async()=>member},'../../../lib/db':{ensureAttempts:async()=>{queries++},pool:{query:async()=>{queries++;throw Error()}}}});
  const previous=process.env.ADMIN_USER_IDS;process.env.ADMIN_USER_IDS='authorized';
  try{const response=await route.GET(request('https://example.org/api/admin?userId=authorized'));assert.equal(response.status,member?403:401);assert.equal(queries,0);assert.match(response.headers.get('cache-control'),/no-store/)}finally{if(previous===undefined)delete process.env.ADMIN_USER_IDS;else process.env.ADMIN_USER_IDS=previous;}
 }
});
test('Import : invités, membres et requêtes externes ne lisent aucun fichier et n’écrivent rien',async()=>{
 const previous=process.env.ADMIN_USER_IDS;process.env.ADMIN_USER_IDS='authorized';
 try{for(const [member,origin,expected] of [[null,'https://example.org',401],[{id:'member'},'https://example.org',403],[{id:'authorized'},'https://other.example',403],[{id:'authorized'},null,403]]){
  let reads=0;
  const route=loadRoute('app/api/admin/materials/route.ts',{session:{currentMember:async()=>member},database:{ensureMaterials:async()=>{reads++},pool:{query:async()=>{reads++}}}});
  const req={...request('https://example.org/api/admin/materials'),formData:async()=>{reads++;throw Error()}};if(origin)req.headers.set('Origin',origin);
  const response=await route.POST(req);assert.equal(response.status,expected);assert.equal(reads,0);assert.equal(response.headers.get('cache-control'),'private, no-store');
 }}finally{if(previous===undefined)delete process.env.ADMIN_USER_IDS;else process.env.ADMIN_USER_IDS=previous;}
});
test('Import d’un PDF nouveau : écriture paramétrée, métadonnées et doublons gérés par empreinte',async()=>{
 const previous=process.env.ADMIN_USER_IDS;process.env.ADMIN_USER_IDS='authorized';
 try{
  const doc=await PDFDocument.create();doc.addPage();const bytes=await doc.save();
  const form=new FormData();form.set('pdf',new File([bytes],'support.pdf',{type:'application/pdf'}));form.set('mode','new');form.set('title',"Support ' UNION --");form.set('description','Cours interne');form.set('track','Organisation');
  const writes=[];const route=loadRoute('app/api/admin/materials/route.ts',{session:{currentMember:async()=>({id:'authorized'})},database:{ensureMaterials:async()=>{},pool:{query:async(sql,params)=>writes.push({sql,params})}}});
  const req={...request('https://example.org/api/admin/materials'),formData:async()=>form};req.headers.set('Origin','https://example.org');
  const response=await route.POST(req);assert.equal(response.status,200);const data=await response.json();assert.equal(data.pages,1);assert.match(data.id,/^uploaded-[a-f0-9]{64}$/);assert.equal(writes.length,1);assert.match(writes[0].sql,/ON CONFLICT\(id\)/);assert.ok(!writes[0].sql.includes("Support ' UNION --"));assert.equal(JSON.parse(writes[0].params[4]).title,"Support ' UNION --");assert.deepEqual(writes[0].params[1],Buffer.from(bytes));
 }finally{if(previous===undefined)delete process.env.ADMIN_USER_IDS;else process.env.ADMIN_USER_IDS=previous;}
});
test('Import : un PDF invalide est refusé avant accès à la base',async()=>{
 const previous=process.env.ADMIN_USER_IDS;process.env.ADMIN_USER_IDS='authorized';
 try{
  const form=new FormData();form.set('pdf',new File(['pas un pdf'],'fake.pdf'));let reads=0;
  const route=loadRoute('app/api/admin/materials/route.ts',{session:{currentMember:async()=>({id:'authorized'})},database:{ensureMaterials:async()=>{reads++},pool:{query:async()=>{reads++}}}});
  const req={...request('https://example.org/api/admin/materials'),formData:async()=>form};req.headers.set('Origin','https://example.org');
  const response=await route.POST(req);assert.equal(response.status,400);assert.equal(reads,0);
 }finally{if(previous===undefined)delete process.env.ADMIN_USER_IDS;else process.env.ADMIN_USER_IDS=previous;}
});
test('API admin : seules les colonnes publiques utiles sont sélectionnées et le compte est un paramètre SQL',async()=>{
 const previous=process.env.ADMIN_USER_IDS;process.env.ADMIN_USER_IDS='authorized';
 const hostile="member' OR 1=1 --",queries=[];
 const route=loadRoute('app/api/admin/route.ts',{'../../../lib/session':{currentMember:async()=>({id:'authorized'})},'../../../lib/db':{ensureAttempts:async()=>{},pool:{query:async(sql,params)=>{queries.push({sql,params});return {rows:queries.length===1?[{id:hostile,name:'Test',email:'test@example.org'}]:queries.length===2?[{count:0,score:0,total:0}]:[]}}}}});
 try{
  const response=await route.GET(request('https://example.org/api/admin?userId='+encodeURIComponent(hostile)));assert.equal(response.status,200);
  for(const query of queries){assert.ok(!query.sql.includes(hostile));assert.equal(query.params[0],hostile);assert.doesNotMatch(query.sql,/password|token|SELECT \*/i)}
 }finally{if(previous===undefined)delete process.env.ADMIN_USER_IDS;else process.env.ADMIN_USER_IDS=previous;}
});
test('Documents : session exigée avant toute lecture et ID limité au catalogue',async()=>{
 for(const member of [null,{id:'member'}]){
  let reads=0;
  const route=loadRoute('app/api/materials/[id]/route.ts',{'../../../../lib/db':{pool:{query:async()=>{reads++;return {rows:[]}}}},'../../../../lib/materials':{ensureMaterials:async()=>{reads++}},'../../../../lib/session':{currentMember:async()=>member},'../../../../content/formations.json':[{id:'sde'}]});
  const response=await route.GET(request('https://example.org/api/materials/private'),{params:Promise.resolve({id:'../../etc/passwd'})});assert.equal(response.status,member?404:401);assert.equal(reads,0);
 }
});
test('Document autorisé : données privées de Neon, paramètre validé et absence de cache partagé',async()=>{
 const queries=[];
 const route=loadRoute('app/api/materials/[id]/route.ts',{'../../../../lib/db':{pool:{query:async(sql,params)=>{queries.push({sql,params});return {rows:[sql.includes('transcript')?{transcript:{pages:[]}}:{pdf:Buffer.from('%PDF-test')}]}}}},'../../../../lib/materials':{ensureMaterials:async()=>{}},'../../../../lib/session':{currentMember:async()=>({id:'member'})},'../../../../content/formations.json':[{id:'sde'}]});
 for(const format of ['','?format=text']){
  const response=await route.GET(request('https://example.org/api/materials/sde'+format),{params:Promise.resolve({id:'sde'})});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.match(response.headers.get('content-type'),format?/application\/json/:/application\/pdf/);
 }
 assert.equal(queries.length,2);for(const q of queries){assert.match(q.sql,/WHERE id=\$1/);assert.equal(q.params[0],'sde')}
});
test('Le catalogue connecté inclut les formations importées sans charger les PDF',async()=>{
 let reads=0;
 const custom={id:'uploaded-'+'a'.repeat(64),title:'Nouveau support',track:'Organisation',description:'Résumé',sections:[]};
 const route=loadRoute('app/api/materials/route.ts',{session:{currentMember:async()=>({id:'member'})},database:{ensureMaterials:async()=>{},pool:{query:async sql=>{reads++;assert.doesNotMatch(sql,/SELECT.*\bpdf\b/i);return {rows:[{id:custom.id,metadata:custom,hasTranscript:false}]}}}}});
 const response=await route.GET(request('https://example.org/api/materials'));assert.equal(response.status,200);assert.equal(reads,1);const data=await response.json();assert.equal(data.formations[0].title,'Nouveau support');assert.equal(data.formations[0].ready,true);assert.equal(data.formations[0].hasTranscript,false);
});
test('Un PDF ajouté depuis l’administration est servi par le lecteur après connexion',async()=>{
 const id='uploaded-'+'a'.repeat(64);
 const route=loadRoute('app/api/materials/[id]/route.ts',{session:{currentMember:async()=>({id:'member'})},database:{ensureMaterials:async()=>{},pool:{query:async(sql,params)=>{assert.equal(params[0],id);return {rows:[{pdf:Buffer.from('%PDF-new')} ]}}}},'../../../../content/formations.json':[]});
 const response=await route.GET(request('https://example.org/api/materials/'+id),{params:Promise.resolve({id})});assert.equal(response.status,200);assert.equal(await response.text(),'%PDF-new');assert.equal(response.headers.get('cache-control'),'private, no-store');
});
