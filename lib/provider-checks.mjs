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
// Convert a v4 Lookup response ({} when clean) to the shape parseGoogle validates.
export function fromLookup(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return payload;
 if(payload.matches!==undefined&&!Array.isArray(payload.matches))return null;
 const byUrl=new Map();let duration='300s';
 for(const m of payload.matches??[]){
  if(!m||typeof m.threat?.url!=='string'||typeof m.threatType!=='string')return null;
  byUrl.set(m.threat.url,[...(byUrl.get(m.threat.url)??[]),m.threatType]);
  if(typeof m.cacheDuration==='string')duration=m.cacheDuration;
 }
 return {cacheDuration:duration,threats:[...byUrl].map(([url,threatTypes])=>({url,threatTypes}))};
}
async function google(url,key,{fetcher,cache,now}){
 // Cache only a URL digest and sanitized threat types, never raw URLs or keys.
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(url));
 const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 const request=new Request('https://linklightns.vercel.app/__security-cache/google/'+hash);
 const cached=await cache.match(request);
 if(cached){try{const data=await cached.json();if(data.state==='ok'&&Array.isArray(data.threatTypes)&&data.expiresAt>now())return data;}catch{/* Treat malformed cache as a miss. */}}
 // v5 urls:search only answers in protobuf, so use the JSON Lookup API (v4).
 const body=JSON.stringify({client:{clientId:'linklight',clientVersion:'1.0'},threatInfo:{threatTypes:['MALWARE','SOCIAL_ENGINEERING','UNWANTED_SOFTWARE','POTENTIALLY_HARMFUL_APPLICATION'],platformTypes:['ANY_PLATFORM'],threatEntryTypes:['URL'],threatEntries:[{url}]}});
 const response=await fetcher('https://safebrowsing.googleapis.com/v4/threatMatches:find',{method:'POST',body,headers:{'x-goog-api-key':key,'Content-Type':'application/json','Accept':'application/json'},signal:AbortSignal.timeout(12000),redirect:'manual'});
 if(!response.ok)throw Error('Provider unavailable');
 const data=parseGoogle(fromLookup(await response.json()),now());
 // Cache both matches and no-match responses for their individual validity.
 const seconds=Math.floor((data.expiresAt-now())/1000);
 if(seconds>0)await cache.put(request,new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','Cache-Control':`max-age=${seconds}`}}));
 return data;
}
async function virusTotal(url,key,fetcher){
 const id=btoa(String.fromCharCode(...new TextEncoder().encode(url))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const response=await fetcher('https://www.virustotal.com/api/v3/urls/'+id,{headers:{'x-apikey':key},signal:AbortSignal.timeout(12000),redirect:'manual'});
 if(response.status===404)return {state:'missing',report:null};
 if(!response.ok)throw Error('Provider unavailable');
 const payload=await response.json(),report=reportSubset(payload?.data?.attributes);
 return {state:report?'ok':'missing',report};
}
async function urlhaus(url,key,fetcher){
 // abuse.ch: listed URLs answer query_status "ok"; unknown URLs answer "no_results".
 const response=await fetcher('https://urlhaus-api.abuse.ch/v1/url/',{method:'POST',body:new URLSearchParams({url}),headers:{'Auth-Key':key,'Accept':'application/json'},signal:AbortSignal.timeout(12000),redirect:'manual'});
 if(!response.ok)throw Error('Provider unavailable');
 const data=await response.json();
 if(data?.query_status==='no_results')return {state:'ok',listed:false};
 if(data?.query_status==='ok')return {state:'ok',listed:true,active:data.url_status==='online'};
 throw Error('Invalid response');
}
async function ipqs(url,key,fetcher){
 // IPQS takes the key in the request path, so this address must never be logged.
 const response=await fetcher('https://www.ipqualityscore.com/api/json/url/'+encodeURIComponent(key)+'/'+encodeURIComponent(url),{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(12000),redirect:'manual'});
 if(!response.ok)throw Error('Provider unavailable');
 const d=await response.json();
 if(d?.success!==true||typeof d.risk_score!=='number')throw Error('Provider unavailable');
 return {state:'ok',phishing:d.phishing===true,malware:d.malware===true,suspicious:d.suspicious===true,risk_score:Math.max(0,Math.min(100,Math.round(d.risk_score)))};
}
const never=async()=>true;
export async function lookupProviders(url,keys,{fetcher=fetch,cache,now=Date.now,reserve=never}={}){
 // Google and URLhaus are cheap and always run. VirusTotal runs only while its
 // own allowance has room; when it is busy or failing, IPQS steps in instead.
 const vtTurn=keys.VT_API_KEY?await reserve('vt'):false;
 const [g,v,h]=await Promise.allSettled([
  google(url,keys.GOOGLE_SAFE_BROWSING_API_KEY,{fetcher,cache,now}),
  vtTurn?virusTotal(url,keys.VT_API_KEY,fetcher):Promise.resolve({state:'skipped',report:null}),
  keys.URLHAUS_AUTH_KEY&&await reserve('urlhaus')?urlhaus(url,keys.URLHAUS_AUTH_KEY,fetcher):Promise.resolve({state:'skipped'})
 ]);
 const safe_browsing=g.status==='fulfilled'?g.value:{state:'unavailable'};
 const vt=v.status==='fulfilled'?v.value:{state:'unavailable',report:null};
 const uh=h.status==='fulfilled'?h.value:{state:'unavailable'};
 let iq={state:'skipped'};
 if(vt.state!=='ok'&&keys.IPQS_API_KEY&&await reserve('ipqs')){
  try{iq=await ipqs(url,keys.IPQS_API_KEY,fetcher);}catch{iq={state:'unavailable'};}
 }
 const stats=vt.report?.last_analysis_stats;
 const positive=stats&&(stats.malicious>0||stats.suspicious>0);
 // Older installed extensions only understand VT statistics. Never give them
 // a clean report if Google flags a threat or could not complete its check.
 const legacyReport=positive||(safe_browsing.state==='ok'&&!safe_browsing.threatTypes.length&&!uh.listed&&!iq.malware&&!iq.phishing)?vt.report:null;
 return {attributes:{...legacyReport,safe_browsing,virus_total:{state:vt.state},urlhaus:uh,ipqs:iq,combined:true}};
}
