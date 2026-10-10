import {kv} from './store';
export function config(){return process.env as unknown as {VT_API_KEY?:string;GOOGLE_SAFE_BROWSING_API_KEY?:string;URLHAUS_AUTH_KEY?:string;IPQS_API_KEY?:string;SCANNING_ENABLED?:string};}
// Each provider has its own counter, so one busy provider never blocks the others.
const limits:Record<string,{spacing:number,daily:number}>={vt:{spacing:16000,daily:450},urlhaus:{spacing:0,daily:20000},ipqs:{spacing:2000,daily:30}};
export async function reserveQuota(provider:string){
 const limit=limits[provider];if(!limit)return false;
 // Atomic per-provider budget shared by every serverless instance. Failed calls count too.
 return kv.reserve(provider,Date.now(),limit.spacing,limit.daily);
}
export function publicURL(raw:unknown){
 if(typeof raw!=='string'||raw.length>8192||/[\s\u0000-\u001f\u007f]/.test(raw))throw Error('Enter a valid web address.');
 let u:URL;try{u=new URL(raw);}catch{throw Error('Enter a complete http:// or https:// address.');}
 if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error('Use a web address without embedded sign-in information.');
 const h=u.hostname.replace(/\.$/,'');if(h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||!h.includes('.')||h.includes(':')||/^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h))throw Error('Use a public website address.');u.hash='';return u.href;
}
