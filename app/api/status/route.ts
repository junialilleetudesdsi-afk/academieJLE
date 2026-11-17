export async function GET(){return Response.json({authenticationReady:Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET)});}
