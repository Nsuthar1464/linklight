import test from 'node:test';
import assert from 'node:assert/strict';
import {lookupProviders,parseGoogle} from './provider-checks.mjs';
import {assess} from '../extension/core.mjs';
const keys={VT_API_KEY:'test-vt-secret',GOOGLE_SAFE_BROWSING_API_KEY:'test-google-secret'};
const url='https://example.com/',time=1800000000000;
function setup({google={cacheDuration:'300s'},vtStatus=200,googleStatus=200,stats={malicious:0,suspicious:0,harmless:65,undetected:5},age=0}={}){
 let clock=time;const records=new Map(),calls=[];
 const cache={async match(req){return records.get(req.url)?.clone();},async put(req,res){records.set(req.url,res.clone());}};
 const fetcher=async (endpoint,options)=>{
  calls.push({endpoint,options});
  if(endpoint.startsWith('https://safebrowsing.googleapis.com/'))return Response.json(google,{status:googleStatus});
  return Response.json({data:{attributes:{last_analysis_stats:stats,last_analysis_date:(time-age)/1000,secret:'never expose raw attributes'}}},{status:vtStatus});
 };
 return {cache,calls,records,fetcher,now:()=>clock,advance:ms=>clock+=ms,lookup:()=>lookupProviders(url,keys,{cache,fetcher,now:()=>clock})};
}
test('keys travel in provider headers only; public output omits raw upstream attributes',async()=>{
 const c=setup(),result=await c.lookup();
 const googleCall=c.calls.find(call=>call.endpoint.includes('safebrowsing.googleapis.com'));
 const vtCall=c.calls.find(call=>call.endpoint.includes('virustotal.com'));
 assert.equal(new URL(googleCall.endpoint).searchParams.get('urls'),url);
 assert.equal(googleCall.options.headers['x-goog-api-key'],keys.GOOGLE_SAFE_BROWSING_API_KEY);
 assert.equal(vtCall.options.headers['x-apikey'],keys.VT_API_KEY);
 for(const call of c.calls){assert.ok(!call.endpoint.includes('secret'));assert.equal(call.options.redirect,'error');}
 const serialized=JSON.stringify(result);assert.ok(!serialized.includes('secret'));assert.ok(!serialized.includes(url));
 for(const [cacheKey,response] of c.records){assert.ok(!cacheKey.includes('example.com'));assert.ok(!(await response.text()).includes('secret'));}
 assert.equal(assess(url,result.attributes,time).label,'Low Risk');
});
test('a Google threat overrides a clean VT report and blocks legacy clean ratings',async()=>{
 const c=setup({google:{cacheDuration:'60s',threats:[{url,threatTypes:['SOCIAL_ENGINEERING']}]}});
 const {attributes}=await c.lookup(),r=assess(url,attributes,time);
 assert.equal(r.label,'High Risk');assert.equal(attributes.last_analysis_stats,undefined);
 assert.equal(r.links[0].label,'Advisory provided by Google');assert.match(r.notes[0],/may/);
 assert.equal(r.googleExpiresAt,time+60000);
});
test('Google no-match cannot turn a missing or stale VT report into Low Risk',async()=>{
 for(const options of [{vtStatus:404},{age:8*86400000},{stats:{malicious:0,suspicious:0,harmless:0,undetected:0}}]){
  const {attributes}=await setup(options).lookup();assert.equal(assess(url,attributes,time).label,'Unknown');
 }
});
test('a failed provider cannot produce a clean rating, while known detections remain visible',async()=>{
 for(const options of [{googleStatus:403},{googleStatus:429},{vtStatus:503},{google:{cacheDuration:'300s',threats:'bad'}}]){
  const {attributes}=await setup(options).lookup();assert.equal(assess(url,attributes,time).label,'Unknown');
 }
 const {attributes}=await setup({googleStatus:503,stats:{malicious:1,suspicious:0,harmless:65,undetected:5}}).lookup();
 assert.equal(assess(url,attributes,time).label,'High Risk');assert.equal(assess(url,attributes,time).links,undefined);
});
test('both match and no-match responses are cached until their individual expiry',async()=>{
 for(const threats of [[],[{url,threatTypes:['MALWARE']}]]){
  const c=setup({google:{cacheDuration:'3.5s',threats}});
  await c.lookup();c.advance(3000);await c.lookup();
  assert.equal(c.calls.filter(c=>c.endpoint.includes('safebrowsing')).length,1);
  c.advance(501);await c.lookup();assert.equal(c.calls.filter(c=>c.endpoint.includes('safebrowsing')).length,2);
 }
});
test('expired Google warnings and expired no-match results cannot sustain a rating',async()=>{
 for(const threats of [[],[{url,threatTypes:['MALWARE']}]]){
  const {attributes}=await setup({google:{cacheDuration:'1s',threats}}).lookup();
  const r=assess(url,attributes,time+1001);assert.equal(r.label,'Unknown');assert.equal(r.links,undefined);
 }
});
test('malformed responses, missing expiration and empty threat definitions are rejected',()=>{
 for(const payload of [null,[],{}, {cacheDuration:'oops'}, {cacheDuration:'0s'},{cacheDuration:'1s',threats:[{url,threatTypes:[]}]},{cacheDuration:'1s',threats:[{url,threatTypes:['THREAT_TYPE_UNSPECIFIED']}]}])assert.throws(()=>parseGoogle(payload,time));
});
test('a network error is sanitized and cannot leak credential-bearing errors',async()=>{
 const c=setup();const {attributes}=await lookupProviders(url,keys,{...c,fetcher:async()=>{throw Error(keys.VT_API_KEY);}});
 assert.equal(assess(url,attributes,time).label,'Unknown');assert.ok(!JSON.stringify(attributes).includes('secret'));
});
