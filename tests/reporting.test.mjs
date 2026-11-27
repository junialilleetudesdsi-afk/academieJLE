import test from 'node:test';
import assert from 'node:assert/strict';
import {success,participation,perMember,summarize,weekEnd,lineSegments} from '../lib/reporting.mjs';
test('Reporting : réussite pondérée et distinction entre absence de résultat et score zéro',()=>{
 const rows=[{attempts:1,score:1,total:1,active:1,members:5},{attempts:9,score:0,total:9,active:2,members:8}];
 const sum=summarize(rows);assert.equal(success(sum),10);assert.equal(sum.attempts,10);assert.equal(sum.active,3);assert.equal(sum.members,13);
 assert.equal(success({score:0,total:0}),null);assert.equal(success({score:0,total:10}),0);assert.equal(participation(rows[0]),20);assert.equal(perMember({total:16,members:8}),2);
});
test('Courbes : aucune liaison artificielle entre des semaines sans notes',()=>{
 const a={week:'2026-11-02',value:70},b={week:'2026-11-16',value:80};assert.deepEqual(lineSegments([null,a,null,b,null]),[[a],[b]]);assert.deepEqual(lineSegments([null,null]),[]);assert.deepEqual(lineSegments([0,0]),[[0,0]]);
});
test('Semaines civiles : fin du dimanche, y compris changement de mois, année et heure',()=>{
 assert.equal(weekEnd('2026-12-28'),'2027-01-03');assert.equal(weekEnd('2026-03-23'),'2026-03-29');assert.equal(weekEnd('2026-10-19'),'2026-10-25');
});
