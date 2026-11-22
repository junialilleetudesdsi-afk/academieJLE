import test from 'node:test';
import assert from 'node:assert/strict';
import {isAdminId,accessStatus,pageNumber} from '../lib/access.mjs';
test('Accès admin fermé par défaut et attribué uniquement à un ID exact',()=>{
 assert.equal(isAdminId('member',''),false);
 assert.equal(isAdminId('first-user',''),false);
 assert.equal(isAdminId('abc','abc-other'),false);
 assert.equal(isAdminId('a@example.org','user-abc'),false);
 assert.equal(isAdminId('one','one, two'),true);
 assert.equal(isAdminId('two','one, two'),true);
 assert.equal(isAdminId('',','),false);
});
test('Un rôle client ou un email ne donne jamais de droit administrateur',()=>{
 assert.equal(accessStatus(null,true,'admin-id'),401);
 assert.equal(accessStatus({id:'user',role:'admin',email:'admin-id'},true,'admin-id'),403);
 assert.equal(accessStatus({id:'admin-id'},true,'admin-id'),200);
 assert.equal(accessStatus({id:'user'},false,'admin-id'),200);
});
test('Les pages ne permettent ni valeurs négatives ni syntaxe SQL',()=>{
 for(const value of ['-1','1.2','Infinity','1;DROP TABLE user','100001'])assert.throws(()=>pageNumber(value));
 assert.equal(pageNumber(null),0);assert.equal(pageNumber('3'),3);
});
