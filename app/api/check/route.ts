import {config,publicURL,reportSubset,reserveQuota} from '../../../lib/security';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
export function OPTIONS(){return new Response(null,{status:204,headers});}
export async function POST(req:Request){
 const c=config();if(c.SCANNING_ENABLED!=='true'||!c.VT_API_KEY)return reply({error:'Security checks are not activated yet. Please try again later. This link has not been rated.'},503);
 if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'Expected a URL check request.'},415);
 try{
  // Bound the stream even when Content-Length is absent or incorrect.
  const reader=req.body?.getReader();if(!reader)return reply({error:'Missing URL.'},400);
  const chunks:Uint8Array[]=[];let size=0;while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>10000){await reader.cancel();return reply({error:'Link is too long.'},413);}chunks.push(part.value);}
  const data=new Uint8Array(size);let pos=0;for(const chunk of chunks){data.set(chunk,pos);pos+=chunk.length;}
  let url:string;try{url=publicURL(JSON.parse(new TextDecoder().decode(data)).url);}catch(e){return reply({error:e instanceof Error?e.message:'Invalid URL.'},400);}
  if(!await reserveQuota())return new Response(JSON.stringify({error:'Linklight’s shared check allowance is busy or used up. Try again later.'}),{status:429,headers:{...headers,'Retry-After':'20'}});
  const id=btoa(String.fromCharCode(...new TextEncoder().encode(url))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const response=await fetch('https://www.virustotal.com/api/v3/urls/'+id,{headers:{'x-apikey':c.VT_API_KEY},signal:AbortSignal.timeout(12000),redirect:'error'});
  if(response.status===404)return reply({attributes:null});
  if(response.status===429)return reply({error:'Security checks are temporarily busy. Try again later.'},429);
  if(!response.ok)return reply({error:'Security checks are temporarily unavailable. This link has not been rated.'},503);
  const payload=await response.json() as {data?:{attributes?:Record<string,unknown>}};
  return reply({attributes:reportSubset(payload.data?.attributes)});
 }catch{return reply({error:'Could not complete the security check. Please try again later.'},503);}
}
