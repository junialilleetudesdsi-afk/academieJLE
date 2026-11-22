import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const formations=read('content/formations.json'),catalog=read('content/catalog.json'),process=read('content/processes.json');
test('Sept formations : manifeste des pages, empreintes, repères et références',()=>{
 assert.equal(formations.length,7);assert.equal(formations.reduce((n,f)=>n+f.pages,0),163);
 for(const f of formations){
  assert.match(f.sha256,/^[a-f0-9]{64}$/);assert.ok(f.pages>0);
  assert.ok(f.notice.length>80);for(const id of f.related)assert.ok(catalog.articles.some(a=>a.id===id));
 }
});
test('La cartographie conserve 41 URL décodées et un process sans lien à venir',()=>{
 assert.equal(process.processes.length,40);const linked=process.processes.filter(p=>p.url);assert.equal(linked.length,39);
 assert.equal(process.quickLinks.length,2);assert.equal(process.processes.filter(p=>!p.url)[0].id,'presidence');
 for(const p of [...linked,...process.quickLinks])assert.match(p.url,/^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+\/edit$/);
 assert.equal(new Set([...linked,...process.quickLinks].map(p=>p.url)).size,41);
 for(const p of process.processes)assert.ok(process.groups.some(g=>g.id===p.group&&g.branch===p.branch));
});
