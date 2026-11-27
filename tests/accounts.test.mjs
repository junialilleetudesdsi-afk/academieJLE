import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {accountBatch,POLES} from '../lib/account-input.mjs';
import {accessStatus} from '../lib/access.mjs';
class NextResponse extends Response{static json(value,options){return new NextResponse(JSON.stringify(value),{...options,headers:{'Content-Type':'application/json',...options?.headers}})}}
function load(path,extra){const js=stripTypeScriptTypes(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{mode:'strip'}).replace(/^import .*;$/gm,'').replace(/export /g,'');return vm.runInNewContext('(()=>{'+js+';return {GET:typeof GET==="undefined"?null:GET,POST:typeof POST==="undefined"?null:POST,PATCH:typeof PATCH==="undefined"?null:PATCH}})()',{NextResponse,Response,Headers,URL,POLES,accountBatch,accessStatus,ensureMembers:async()=>{},ensureAttempts:async()=>{},randomUUID:()=>String(Math.random()),...extra})}
const row={name:'Membre Test',email:'test@example.org',pole:'Bureau',post:'Présidence'};
const req=(body,origin='https://example.org')=>({headers:new Headers(origin?{origin}:{}),nextUrl:new URL('https://example.org/api/admin/accounts'),text:async()=>JSON.stringify(body)});
test('Import : validation du lot, doublons et absence de rôle imposé par le client',()=>{
 const parsed=accountBatch({users:[{...row,email:' TEST@EXAMPLE.ORG ',role:'admin'}],password:'example-password'});assert.equal(parsed.users[0].email,'test@example.org');assert.equal(parsed.users[0].role,undefined);
 for(const users of [[],[row,{...row,email:'TEST@example.org'}],[{...row,pole:'Inconnu'}],[null],Array(51).fill(row)])assert.throws(()=>accountBatch({users,password:'example-password'}));
 assert.throws(()=>accountBatch({users:[row],password:'short'}));
});
test('Rôles persistants : une rétrogradation prime sur l’ancien identifiant admin configuré',()=>{
 assert.equal(accessStatus({id:'old-admin',siteRole:'member'},true,'old-admin'),403);assert.equal(accessStatus({id:'new-admin',siteRole:'admin'},true,''),200);
});
test('Création de comptes : invité, membre et origine étrangère refusés avant lecture ou écriture',async()=>{
 for(const [member,origin,status] of [[null,'https://example.org',401],[{id:'m',siteRole:'member'},'https://example.org',403],[{id:'a',siteRole:'admin'},'https://foreign.org',403]]){
  let touched=0;const route=load('app/api/admin/accounts/route.ts',{currentMember:async()=>member,pool:{connect:async()=>{touched++;throw Error()}}});const request=req({},origin);request.text=async()=>{touched++;return '{}'};
  for(const method of ['POST','PATCH']){const response=await route[method](request);assert.equal(response.status,status);assert.equal(touched,0);assert.match(response.headers.get('cache-control'),/no-store/)}
 }
});
test('Import atomique : compte existant et résultats conservés, nouvel utilisateur créé avec un hash',async()=>{
 const queries=[];let released=false;
 const db={release:()=>{released=true},query:async(sql,params)=>{queries.push({sql,params});return {rows:sql.startsWith('SELECT id,name')?(params[0]===row.email?[{id:'existing'}]:[]):[]}}};
 const route=load('app/api/admin/accounts/route.ts',{currentMember:async()=>({id:'a',siteRole:'admin'}),pool:{connect:async()=>db},auth:{$context:Promise.resolve({password:{hash:async()=>'$HASHED$'}})}});
 const response=await route.POST(req({users:[row,{...row,email:'new@example.org'}],password:'example-password'}));assert.equal(response.status,200);const data=await response.json();assert.equal(data.created,1);assert.equal(data.existing,1);assert.equal(released,true);
 const credential=queries.filter(q=>q.sql.includes('INSERT INTO "account"'));assert.equal(credential.length,1);assert.ok(credential[0].params.includes('$HASHED$'));assert.ok(!queries.some(q=>q.sql.includes('jle_attempts')||q.sql.includes('UPDATE "account"')));assert.equal(queries.at(-1).sql,'COMMIT');
 for(const q of queries)assert.ok(!q.sql.includes('example-password'));
 const memberships=queries.filter(q=>q.sql.startsWith('INSERT INTO jle_members'));assert.equal(memberships.length,2);assert.doesNotMatch(memberships[0].sql.split('DO UPDATE')[1],/role\s*=/);
});
test('Une erreur au milieu du lot annule toute la transaction',async()=>{
 const queries=[];const route=load('app/api/admin/accounts/route.ts',{currentMember:async()=>({id:'a',siteRole:'admin'}),pool:{connect:async()=>({release:()=>{},query:async sql=>{queries.push(sql);if(sql.includes('INSERT INTO "account"'))throw Error();return {rows:[]}}})},auth:{$context:Promise.resolve({password:{hash:async()=>'$HASHED$'}})}});
 const response=await route.POST(req({users:[row],password:'example-password'}));assert.equal(response.status,503);assert.equal(queries.at(-1),'ROLLBACK');assert.ok(!queries.includes('COMMIT'));
});
test('Un administrateur ne peut pas retirer son propre accès',async()=>{
 let touched=0;const route=load('app/api/admin/accounts/route.ts',{currentMember:async()=>({id:'a',siteRole:'admin'}),pool:{connect:async()=>{touched++}}});const response=await route.PATCH(req({id:'a',role:'member',pole:'Bureau',post:''}));assert.equal(response.status,409);assert.equal(touched,0);
});
test('Suivi des pôles : authentification et filtres validés ; seuls les agrégats sont retournés',async()=>{
 let touched=0;const extra={currentMember:async()=>null,pool:{query:async()=>{touched++;return {rows:[]}}}};const url=(q='')=>({headers:new Headers(),nextUrl:new URL('https://example.org/api/activity'+q)});
 assert.equal((await load('app/api/activity/route.ts',extra).GET(url())).status,401);assert.equal(touched,0);
 extra.currentMember=async()=>({id:'m',siteRole:'member'});const route=load('app/api/activity/route.ts',extra);assert.equal((await route.GET(url('?days=-3'))).status,400);assert.equal(touched,0);
 extra.pool.query=async(sql,params)=>{assert.match(sql,/GROUP BY m.pole/);assert.doesNotMatch(sql,/email|password|SELECT.*name/i);assert.equal(params[0],30);return {rows:[{pole:'Bureau',members:5,attempts:0}]}};
 const r=await route.GET(url());assert.equal(r.status,200);assert.equal((await r.json()).poles[0].members,5);assert.equal(r.headers.get('cache-control'),'private, no-store');
});
