import {auth} from './auth';
import {membership} from './membership';
export async function currentMember(headers:Headers){
 const user=auth?(await auth.api.getSession({headers}))?.user:null;
 if(!user)return null;
 const entry=await membership(user.id);
 return entry?{...user,siteRole:entry.role,pole:entry.pole,post:entry.post}:null;
}
