import {env} from 'cloudflare:workers';
export function config(){return env as unknown as {DB?:D1Database;VT_API_KEY?:string;GOOGLE_SAFE_BROWSING_API_KEY?:string;SCANNING_ENABLED?:string};}
export async function reserveQuota(){
 const db=config().DB;if(!db)throw Error('storage');const now=Date.now(),day=Math.floor(now/86400000);
 // One atomic row protects the shared provider budget across all Worker instances.
 // Requests are spaced 20s apart (3/min), capped at 450/day, including failures.
 const row=await db.prepare(`INSERT INTO quota(id,day,count,next) VALUES('shared',?,1,?) ON CONFLICT(id) DO UPDATE SET day=excluded.day,count=CASE WHEN quota.day=excluded.day THEN quota.count+1 ELSE 1 END,next=excluded.next WHERE quota.next<=? AND (quota.day<>excluded.day OR quota.count<450) RETURNING count`).bind(day,now+20000,now).first();return !!row;
}
export function publicURL(raw:unknown){
 if(typeof raw!=='string'||raw.length>8192||/[\s\u0000-\u001f\u007f]/.test(raw))throw Error('Enter a valid web address.');
 let u:URL;try{u=new URL(raw);}catch{throw Error('Enter a complete http:// or https:// address.');}
 if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error('Use a web address without embedded sign-in information.');
 const h=u.hostname.replace(/\.$/,'');if(h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||!h.includes('.')||h.includes(':')||/^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h))throw Error('Use a public website address.');u.hash='';return u.href;
}
