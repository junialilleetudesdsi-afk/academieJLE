// IDs are granted manually in the server environment. Never trust a role from a client or an unverified email.
export function isAdminId(id, configured = process.env.ADMIN_USER_IDS ?? '') {
 return typeof id==='string' && id.length>0 && configured.split(',').map(s=>s.trim()).filter(Boolean).includes(id);
}
export function accessStatus(user, adminOnly=false, configured) {
 if(!user?.id) return 401;
 if(adminOnly&&!(user.siteRole!==undefined?user.siteRole==='admin':isAdminId(user.id,configured))) return 403;
 return 200;
}
export function pageNumber(value) {
 const parsed=Number(value ?? '0');
 if(!Number.isSafeInteger(parsed)||parsed<0||parsed>100000) throw new Error('Page invalide');
 return parsed;
}
