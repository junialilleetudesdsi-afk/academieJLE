'use client';
import {useState} from 'react';
import {createAuthClient} from 'better-auth/react';
const auth=createAuthClient();
export default function AccountSettings({pole,post}:{pole:string;post:string}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function change(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget,fields=new FormData(form);if(fields.get('password')!==fields.get('confirmation')){setMessage('Les deux nouveaux mots de passe doivent être identiques.');return}setBusy(true);setMessage('');try{const result=await auth.changePassword({currentPassword:String(fields.get('current')),newPassword:String(fields.get('password')),revokeOtherSessions:true});if(result.error)setMessage('Modification impossible. Vérifiez votre mot de passe actuel.');else{form.reset();setMessage('Votre mot de passe a été modifié.')}}catch{setMessage('Modification indisponible. Réessayez.')}finally{setBusy(false)}}
 return <section className="library member-summary"><h2>Votre profil</h2><p>{pole}{post?' · '+post:''}</p><details><summary>Changer mon mot de passe</summary><form className="import-form" onSubmit={change}><label>Mot de passe actuel<input type="password" name="current" required autoComplete="current-password"/></label><label>Nouveau mot de passe<input type="password" name="password" required minLength={7} maxLength={128} autoComplete="new-password"/></label><label>Confirmer le nouveau mot de passe<input type="password" name="confirmation" required minLength={7} maxLength={128} autoComplete="new-password"/></label><button className="primary" disabled={busy}>{busy?'Modification…':'Enregistrer le mot de passe'}</button><p role="status">{message}</p></form></details></section>
}
