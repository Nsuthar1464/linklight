import {normalize,assess} from '../extension/core.mjs';
export async function checkWebsite(raw,fetcher=fetch,signal=AbortSignal.timeout(20000)) {
 const url=normalize(raw);
 let response;
 try{response=await fetcher('/api/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url}),signal,cache:'no-store',redirect:'error'});}
 catch{throw Error('The check could not finish. Check your connection and try again.');}
 let payload;try{payload=await response.json();}catch{throw Error('Linklight is temporarily unavailable. Please try again.');}
 if(!response.ok)throw Error(typeof payload?.error==='string'?payload.error:'The check is unavailable. Please try again.');
 return {url,...assess(url,payload?.attributes??null)};
}
