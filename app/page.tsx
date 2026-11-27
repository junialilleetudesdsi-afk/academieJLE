import {headers} from 'next/headers';
import {currentMember} from '../lib/session';
import {ContentProvider} from '../components/content-provider';
import Home from './academy-client';
import Login from '../components/login';
import catalog from '../content/catalog.json';
import formations from '../content/formations.json';
import processes from '../content/processes.json';
export const dynamic='force-dynamic';
export const revalidate=0;
export default async function Page(){
 let member;try{member=await currentMember(await headers())}catch{return <Login unavailable/>}
 if(!member)return <Login/>;
 return <ContentProvider value={{catalog,formations,processes}}><Home member={{id:member.id,name:member.name,siteRole:member.siteRole,pole:member.pole,post:member.post}}/></ContentProvider>;
}
