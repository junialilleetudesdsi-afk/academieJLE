import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
import {prepareMaterial,parseTranscript,MAX_PDF_BYTES} from '../lib/material-upload.mjs';

test('Import : contrôle réel du PDF, limite de taille et métadonnées',async()=>{
 const doc=await PDFDocument.create();doc.addPage();doc.addPage();const pdf=Buffer.from(await doc.save());
 const fields={mode:'new',title:'  Formation de test ',track:'Organisation',description:'Résumé du cours',filename:'cours.pdf'};
 const item=await prepareMaterial(pdf,fields,[]);assert.equal(item.pages,2);assert.equal(item.metadata.title,'Formation de test');assert.equal(item.metadata.sections[0].body,'Résumé du cours');assert.equal(item.transcript,null);
 assert.equal((await prepareMaterial(pdf,fields,[])).id,item.id);
 await assert.rejects(prepareMaterial(Buffer.alloc(MAX_PDF_BYTES+1),fields,[]),{status:413});
 await assert.rejects(prepareMaterial(Buffer.from('%PDF-broken'),fields,[]),/illisible/);
 await assert.rejects(prepareMaterial(pdf,{...fields,track:'Admin'},[]),/thème/);
 await assert.rejects(prepareMaterial(pdf,{...fields,title:'x'},[]),/titre/);
});
test('Lot préparé : empreinte stricte et transcription contrôlée',async()=>{
 const pdf=Buffer.from('%PDF-trusted-fixture'),sha256=createHash('sha256').update(pdf).digest('hex');
 const preset={id:'test',title:'Support',pages:1,sha256};
 const item=await prepareMaterial(pdf,{mode:'prepared',transcript:JSON.stringify({pages:[{number:1,text:'Texte de la page'}]})},[preset]);assert.equal(item.id,'test');assert.equal(item.metadata,null);assert.equal(item.transcript.pages[0].text,'Texte de la page');
 await assert.rejects(prepareMaterial(pdf,{mode:'prepared'},[]),/non reconnu/);
 assert.throws(()=>parseTranscript('{"pages":[]}',1),/correspondre/);
 assert.throws(()=>parseTranscript('{"pages":[{"number":2,"text":"Erreur"}]}',1),/correspondre/);
 assert.throws(()=>parseTranscript('no json',1),/JSON invalide/);
});
