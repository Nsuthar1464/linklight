// Server-only provider requests. Never log inputs, credentials or upstream errors.
export function reportSubset(a){
 const stats=a?.last_analysis_stats;
 if(!stats)return null;
 const clean={};for(const k of ['malicious','suspicious','harmless','undetected']){
  if(!Number.isInteger(stats[k])||stats[k]<0)return null;clean[k]=stats[k];
 }
 return {last_analysis_stats:clean,last_analysis_date:typeof a.last_analysis_date==='number'?a.last_analysis_date:null};
}
export function parseGoogle(payload,now=Date.now()){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Invalid response');
 const duration=payload.cacheDuration;
 if(typeof duration!=='string'||!/^\d+(\.\d{1,9})?s$/.test(duration))throw Error('Invalid response');
 const milliseconds=Number(duration.slice(0,-1))*1000;
 if(!Number.isFinite(milliseconds)||milliseconds<=0)throw Error('Invalid response');
 if(payload.threats!==undefined&&!Array.isArray(payload.threats))throw Error('Invalid response');
 const types=new Set();
 for(const threat of payload.threats??[]){
  if(!threat||typeof threat.url!=='string'||!Array.isArray(threat.threatTypes)||!threat.threatTypes.length)throw Error('Invalid response');
  for(const type of threat.threatTypes){
   if(typeof type!=='string'||!/^[A-Z_]{1,80}$/.test(type)||type==='THREAT_TYPE_UNSPECIFIED')throw Error('Invalid response');
   types.add(type);
  }
 }
 return {state:'ok',threatTypes:[...types],checkedAt:now,expiresAt:now+Math.min(milliseconds,86400000)};
}
async function google(url,key,{fetcher,cache,now}){
 // Cache only a URL digest and sanitized threat types, never raw URLs or keys.
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(url));
 const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 const request=new Request('https://linklight-check.alivecod8.chatgpt.site/__security-cache/google/'+hash);
 const cached=await cache.match(request);
 if(cached){try{const data=await cached.json();if(data.state==='ok'&&Array.isArray(data.threatTypes)&&data.expiresAt>now())return data;}catch{/* Treat malformed cache as a miss. */}}
 const endpoint=new URL('https://safebrowsing.googleapis.com/v5/urls:search');
 endpoint.searchParams.append('urls',url);
 const response=await fetcher(endpoint.href,{headers:{'x-goog-api-key':key,'Accept':'application/json'},signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!response.ok)throw Error('Provider unavailable');
 const data=parseGoogle(await response.json(),now());
 // Cache both matches and no-match responses for their individual validity.
 const seconds=Math.floor((data.expiresAt-now())/1000);
 if(seconds>0)await cache.put(request,new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','Cache-Control':`max-age=${seconds}`}}));
 return data;
}
async function virusTotal(url,key,fetcher){
 const id=btoa(String.fromCharCode(...new TextEncoder().encode(url))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const response=await fetcher('https://www.virustotal.com/api/v3/urls/'+id,{headers:{'x-apikey':key},signal:AbortSignal.timeout(12000),redirect:'error'});
 if(response.status===404)return {state:'missing',report:null};
 if(!response.ok)throw Error('Provider unavailable');
 const payload=await response.json(),report=reportSubset(payload?.data?.attributes);
 return {state:report?'ok':'missing',report};
}
export async function lookupProviders(url,keys,{fetcher=fetch,cache,now=Date.now}={}){
 const [g,v]=await Promise.allSettled([
  google(url,keys.GOOGLE_SAFE_BROWSING_API_KEY,{fetcher,cache,now}),
  virusTotal(url,keys.VT_API_KEY,fetcher)
 ]);
 const safe_browsing=g.status==='fulfilled'?g.value:{state:'unavailable'};
 const vt=v.status==='fulfilled'?v.value:{state:'unavailable',report:null};
 const stats=vt.report?.last_analysis_stats;
 const positive=stats&&(stats.malicious>0||stats.suspicious>0);
 // Older installed extensions only understand VT statistics. Never give them
 // a clean report if Google flags a threat or could not complete its check.
 const legacyReport=positive||(safe_browsing.state==='ok'&&!safe_browsing.threatTypes.length)?vt.report:null;
 return {attributes:{...legacyReport,safe_browsing,virus_total:{state:vt.state},combined:true}};
}
