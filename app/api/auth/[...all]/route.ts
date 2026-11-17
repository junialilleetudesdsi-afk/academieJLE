import { auth, configured } from '../../../../lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
const handlers = auth ? toNextJsHandler(auth) : null;
const unavailable = () => Response.json({message:'La connexion sera disponible après configuration de la base de données.'},{status:503});
export const GET = (request:Request) => handlers ? handlers.GET(request) : unavailable();
export const POST = (request:Request) => handlers ? handlers.POST(request) : unavailable();
