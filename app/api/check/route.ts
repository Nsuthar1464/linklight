import {config,publicURL,reserveQuota} from '../../../lib/security';
import {lookupProviders} from '../../../lib/provider-checks.mjs';
import {cache} from '../../../lib/store';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
export const runtime='nodejs';
export const maxDuration=30;
export function OPTIONS(){return new Response(null,{status:204,headers});}
export async function POST(req:Request){
 const c=config();if(c.SCANNING_ENABLED!=='true'||!c.GOOGLE_SAFE_BROWSING_API_KEY)return reply({error:'Security checks are not activated yet. Please try again later. This link has not been rated.'},503);
 if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'Expected a URL check request.'},415);
 try{
  // Bound the stream even when Content-Length is absent or incorrect.
  const reader=req.body?.getReader();if(!reader)return reply({error:'Missing URL.'},400);
  const chunks:Uint8Array[]=[];let size=0;while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>10000){await reader.cancel();return reply({error:'Link is too long.'},413);}chunks.push(part.value);}
  const data=new Uint8Array(size);let pos=0;for(const chunk of chunks){data.set(chunk,pos);pos+=chunk.length;}
  let url:string;try{url=publicURL(JSON.parse(new TextDecoder().decode(data)).url);}catch(e){return reply({error:e instanceof Error?e.message:'Invalid URL.'},400);}
  return reply(await lookupProviders(url,{VT_API_KEY:c.VT_API_KEY,GOOGLE_SAFE_BROWSING_API_KEY:c.GOOGLE_SAFE_BROWSING_API_KEY,URLHAUS_AUTH_KEY:c.URLHAUS_AUTH_KEY,IPQS_API_KEY:c.IPQS_API_KEY},{cache,reserve:reserveQuota}));
 }catch{return reply({error:'Could not complete the security check. Please try again later.'},503);}
}
