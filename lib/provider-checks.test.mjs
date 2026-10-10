import test from 'node:test';
import assert from 'node:assert/strict';
import {lookupProviders,parseGoogle} from './provider-checks.mjs';
import {assess} from '../extension/core.mjs';
const keys={VT_API_KEY:'test-vt-secret',GOOGLE_SAFE_BROWSING_API_KEY:'test-google-secret'};
const url='https://example.com/',time=1800000000000;
// Mimic the v4 Lookup API: clean URLs answer {}, matches carry a cacheDuration.
function toLookup(g){
 if(g&&g.threats!==undefined&&!Array.isArray(g.threats))return {matches:g.threats};
 if(!g||!Array.isArray(g.threats))return g;
 if(!g.threats.length)return {};
 return {matches:g.threats.flatMap(t=>t.threatTypes.map(threatType=>({threatType,threat:{url:t.url},cacheDuration:g.cacheDuration})))};
}
function setup({google={cacheDuration:'300s'},vtStatus=200,googleStatus=200,stats={malicious:0,suspicious:0,harmless:65,undetected:5},age=0}={}){
 let clock=time;const records=new Map(),calls=[];
 const cache={async match(req){return records.get(req.url)?.clone();},async put(req,res){records.set(req.url,res.clone());}};
 const fetcher=async (endpoint,options)=>{
  calls.push({endpoint,options});
  if(endpoint.startsWith('https://safebrowsing.googleapis.com/'))return Response.json(toLookup(google),{status:googleStatus});
  return Response.json({data:{attributes:{last_analysis_stats:stats,last_analysis_date:(time-age)/1000,secret:'never expose raw attributes'}}},{status:vtStatus});
 };
 return {cache,calls,records,fetcher,now:()=>clock,advance:ms=>clock+=ms,lookup:()=>lookupProviders(url,keys,{cache,fetcher,now:()=>clock})};
}
test('keys travel in provider headers only; public output omits raw upstream attributes',async()=>{
 const c=setup(),result=await c.lookup();
 const googleCall=c.calls.find(call=>call.endpoint.includes('safebrowsing.googleapis.com'));
 const vtCall=c.calls.find(call=>call.endpoint.includes('virustotal.com'));
 assert.equal(googleCall.options.method,'POST');assert.equal(JSON.parse(googleCall.options.body).threatInfo.threatEntries[0].url,url);
 assert.equal(googleCall.options.headers['x-goog-api-key'],keys.GOOGLE_SAFE_BROWSING_API_KEY);
 assert.equal(vtCall.options.headers['x-apikey'],keys.VT_API_KEY);
 for(const call of c.calls){assert.ok(!call.endpoint.includes('secret'));assert.equal(call.options.redirect,'manual');}
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
  // Clean results carry no duration in the v4 API, so they use the 300s default.
  const c=setup({google:{cacheDuration:'300s',threats}});
  await c.lookup();c.advance(299000);await c.lookup();
  assert.equal(c.calls.filter(c=>c.endpoint.includes('safebrowsing')).length,1);
  c.advance(1001);await c.lookup();assert.equal(c.calls.filter(c=>c.endpoint.includes('safebrowsing')).length,2);
 }
});
test('expired Google warnings and expired no-match results cannot sustain a rating',async()=>{
 for(const threats of [[],[{url,threatTypes:['MALWARE']}]]){
  const {attributes}=await setup({google:{cacheDuration:'300s',threats}}).lookup();
  const r=assess(url,attributes,time+300001);assert.equal(r.label,'Unknown');assert.equal(r.links,undefined);
 }
});
test('malformed responses, missing expiration and empty threat definitions are rejected',()=>{
 for(const payload of [null,[],{}, {cacheDuration:'oops'}, {cacheDuration:'0s'},{cacheDuration:'1s',threats:[{url,threatTypes:[]}]},{cacheDuration:'1s',threats:[{url,threatTypes:['THREAT_TYPE_UNSPECIFIED']}]}])assert.throws(()=>parseGoogle(payload,time));
});
test('a network error is sanitized and cannot leak credential-bearing errors',async()=>{
 const c=setup();const {attributes}=await lookupProviders(url,keys,{...c,fetcher:async()=>{throw Error(keys.VT_API_KEY);}});
 assert.equal(assess(url,attributes,time).label,'Unknown');assert.ok(!JSON.stringify(attributes).includes('secret'));
});
function failover({listed=false,vtBusy=true,iqs}={}){
 const calls=[];
 const fetcher=async(endpoint,options)=>{
  calls.push(endpoint);
  if(endpoint.startsWith('https://safebrowsing.googleapis.com/'))return Response.json({});
  if(endpoint.startsWith('https://urlhaus-api.abuse.ch/'))return Response.json({query_status:listed?'ok':'no_results',url_status:'online'});
  if(endpoint.startsWith('https://www.ipqualityscore.com/'))return Response.json(iqs??{success:true,risk_score:3,phishing:false,malware:false,suspicious:false});
  return Response.json({data:{attributes:{last_analysis_stats:{malicious:0,suspicious:0,harmless:65,undetected:5},last_analysis_date:time/1000}}});
 };
 const m=new Map();const cache={async match(r){return m.get(r.url)?.clone();},async put(r,x){m.set(r.url,x.clone());}};
 const asked=[];const reserve=async name=>{asked.push(name);return name==='vt'?!vtBusy:true;};
 return {calls,asked,run:()=>lookupProviders(url,{...keys,URLHAUS_AUTH_KEY:'uh-secret',IPQS_API_KEY:'iq-secret'},{cache,fetcher,now:()=>time,reserve})};
}
test('when VirusTotal is busy, the other sources still produce a rating and VT is not called',async()=>{
 const f=failover(),{attributes}=await f.run();
 assert.ok(!f.calls.some(c=>c.includes('virustotal.com')));
 assert.equal(attributes.virus_total.state,'skipped');
 assert.equal(assess(url,attributes,time).label,'Low Risk');
});
test('a URLhaus listing is High Risk even when VirusTotal is busy',async()=>{
 const {attributes}=await failover({listed:true}).run();
 assert.equal(assess(url,attributes,time).label,'High Risk');
});
test('IPQS is only used when VirusTotal could not answer',async()=>{
 const busy=failover();await busy.run();assert.ok(busy.calls.some(c=>c.includes('ipqualityscore.com')));
 const ok=failover({vtBusy:false});await ok.run();assert.ok(!ok.calls.some(c=>c.includes('ipqualityscore.com')));
});
test('an IPQS phishing verdict is High Risk, a suspicious one is at least Medium',async()=>{
 const hi=await failover({iqs:{success:true,risk_score:90,phishing:true,malware:false,suspicious:true}}).run();
 assert.equal(assess(url,hi.attributes,time).label,'High Risk');
 const mid=await failover({iqs:{success:true,risk_score:50,phishing:false,malware:false,suspicious:true}}).run();
 assert.equal(assess(url,mid.attributes,time).label,'Medium Risk');
});
test('IPQS out of credits does not break the check, and Google alone is still Unknown',async()=>{
 const {attributes}=await failover({iqs:{success:false,message:'You have insufficient credits'}}).run();
 assert.equal(attributes.ipqs.state,'unavailable');
 // URLhaus is clean here, so the rating still completes.
 assert.equal(assess(url,attributes,time).label,'Low Risk');
 const none=await lookupProviders(url,{GOOGLE_SAFE_BROWSING_API_KEY:'g'},{cache:{match:async()=>undefined,put:async()=>{}},fetcher:async()=>Response.json({}),now:()=>time});
 assert.equal(assess(url,none.attributes,time).label,'Unknown');
});
