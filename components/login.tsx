'use client';
import {useState} from 'react';
import {createAuthClient} from 'better-auth/react';
import {ArrowRight,LockKeyhole} from 'lucide-react';
const auth=createAuthClient();
export default function Login({unavailable=false}:{unavailable?:boolean}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setError('');
  try{const result=await auth.signIn.email({email:String(form.get('email')).trim(),password:String(form.get('password'))});if(result.error){setError('Connexion impossible. Vérifiez votre adresse e-mail et votre mot de passe.');return}
   const response=await fetch('/api/account',{cache:'no-store'}),data=await response.json();
   if(!response.ok||!data.id){await auth.signOut();setError('Ce compte n’a pas encore accès à l’académie. Contactez un administrateur JLE.');return}
   window.location.replace('/');
  }catch{setError('Le service est momentanément indisponible. Réessayez.')}finally{setBusy(false)}
 }
 return <main className="login-page"><section className="login-card"><img className="login-logo" src="https://junia-lille-etudes.odoo.com/web/image/website/1/logo" alt="Junia Lille Études"/><span className="eyebrow">ACADÉMIE JLE</span><h1>Connexion</h1><p><LockKeyhole size={16}/> Connectez-vous pour accéder aux connaissances et aux entraînements.</p><form onSubmit={submit} className="import-form"><label>Adresse e-mail<input name="email" type="email" autoComplete="username" required maxLength={254}/></label><label>Mot de passe<input name="password" type="password" autoComplete="current-password" required minLength={7} maxLength={128}/></label><button className="primary" disabled={busy}>{busy?'Connexion…':'Se connecter'}<ArrowRight size={18}/></button></form>{(error||unavailable)&&<p className="notice" role="alert">{error||'La connexion est momentanément indisponible. Réessayez dans quelques instants.'}</p>}<p className="fineprint">Votre compte est créé par un administrateur JLE.</p><small>Vos projets, nos compétences.</small></section></main>
}
