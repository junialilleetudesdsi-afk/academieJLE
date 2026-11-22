import { auth } from './auth';
export async function currentMember(headers:Headers) {
 return auth ? (await auth.api.getSession({headers}))?.user : null;
}
