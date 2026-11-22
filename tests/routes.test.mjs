import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import * as access from '../lib/access.mjs';
class NextResponse extends Response {static json(value,options){return new NextResponse(JSON.stringify(value),{...options,headers:{'Content-Type':'application/json',...options?.headers}})}}
function loadRoute(path,mocks){
 const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const js=stripTypeScriptTypes(source,{mode:'strip'}).replace(/^import .*;$/gm,'').replace(/export /g,'');
 const context=vm.createContext({NextResponse,...Object.assign({},...Object.values(mocks)),path:mocks['node:path'],materials:mocks['../../../../content/formations.json'],...access,process,Response,Headers,Buffer,URL,console});
 return vm.runInContext('(()=>{'+js+';return {GET};})()',context);
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
