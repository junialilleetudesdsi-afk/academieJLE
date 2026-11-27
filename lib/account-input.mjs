export const POLES=['Bureau','ActiCo','Qualité','Marketing','Non affecté'];
export function accountBatch(body){
 if(!Array.isArray(body?.users)||body.users.length<1||body.users.length>50)throw Error('Sélectionnez entre 1 et 50 comptes.');
 if(typeof body.password!=='string'||body.password.length<7||body.password.length>128)throw Error('Le mot de passe initial doit contenir entre 7 et 128 caractères.');
 const seen=new Set();
 const users=body.users.map(row=>{
  const name=typeof row.name==='string'?row.name.trim():'',email=typeof row.email==='string'?row.email.trim().toLowerCase():'',post=typeof row.post==='string'?row.post.trim():'';
  if(name.length<2||name.length>100||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||!POLES.includes(row.pole)||post.length>120)throw Error('Nom, e-mail, pôle ou poste invalide.');
  if(seen.has(email))throw Error('La liste contient un e-mail en double.');seen.add(email);
  return {name,email,pole:row.pole,post};
 });
 return {users,password:body.password};
}
