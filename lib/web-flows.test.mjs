import test from 'node:test';
import assert from 'node:assert/strict';
import {createWebScanner} from './web-scanner.mjs';
import {checkWebsite} from './web-check.mjs';

function setup(overrides={}){
 let stopped=0,played=0,code=null;const states=[],jobs=new Map();let id=0;
 const track={stop(){stopped++;},addEventListener(){}};
 const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 const video={srcObject:null,readyState:2,async play(){assert.equal(this.srcObject,stream);played++;},pause(){}};
 const scanner=createWebScanner({video,getStream:async()=>stream,decode:async()=>null,onState:(...s)=>states.push(s),onCode:raw=>{assert.equal(stopped,1);code=raw;},schedule:(fn,ms)=>{jobs.set(++id,{fn,ms});return id;},cancel:key=>jobs.delete(key),...overrides});
 return {scanner,video,stream,states,jobs,get stopped(){return stopped;},get played(){return played;},get code(){return code;}};
}
test('website camera attaches stream to mounted preview before playing',async()=>{const c=setup();await c.scanner.start();assert.equal(c.played,1);assert.equal(c.video.srcObject,c.stream);assert.equal(c.states.at(-1)[0],'running');c.scanner.stop();assert.equal(c.video.srcObject,null);assert.equal(c.stopped,1);assert.equal(c.jobs.size,0);});
test('QR detection stops video and both timers before showing link',async()=>{const c=setup({decode:async()=> 'https://example.com'});await c.scanner.start();await Promise.resolve();assert.equal(c.code,'https://example.com');assert.equal(c.stopped,1);assert.equal(c.jobs.size,0);});
test('cancel during permission releases a late stream without playing',async()=>{let grant;const c=setup({getStream:()=>new Promise(r=>grant=r)});const start=c.scanner.start();c.scanner.stop();grant(c.stream);await start;assert.equal(c.played,0);assert.equal(c.stopped,1);assert.equal(c.jobs.size,0);});
test('repeat start requests only one camera',async()=>{let grant,calls=0;const c=setup({getStream:()=>{calls++;return new Promise(r=>grant=r);}});const start=c.scanner.start();await c.scanner.start();assert.equal(calls,1);grant(c.stream);await start;c.scanner.stop();});
test('permission denied returns recovery guidance',async()=>{const c=setup({getStream:async()=>{throw Object.assign(Error(),{name:'NotAllowedError'});}});await c.scanner.start();assert.match(c.states.at(-1)[1],/browser settings/);assert.equal(c.jobs.size,0);});
test('playback failure releases the camera',async()=>{const c=setup();c.video.play=async()=>{throw Error('Preview unavailable');};await c.scanner.start();assert.equal(c.stopped,1);assert.equal(c.video.srcObject,null);});
test('timeout stops camera and cancels frame scan',async()=>{const c=setup();await c.scanner.start();const deadline=[...c.jobs.values()].find(x=>x.ms===60000);deadline.fn();assert.equal(c.stopped,1);assert.equal(c.jobs.size,0);});
test('late QR decode after stop cannot fill the form',async()=>{let decode;const c=setup({decode:()=>new Promise(r=>decode=r)});await c.scanner.start();c.scanner.stop();decode('https://example.com');await Promise.resolve();assert.equal(c.code,null);});
const report=(malicious=0,date=Date.now()/1000)=>({attributes:{last_analysis_stats:{malicious,suspicious:0,harmless:65,undetected:5},last_analysis_date:date}});
test('website submits a bare domain without a key and returns a real result',async()=>{const r=await checkWebsite('example.com',async(url,init)=>{assert.equal(url,'/api/check');assert.equal(JSON.parse(init.body).url,'https://example.com/');assert.deepEqual(init.headers,{'Content-Type':'application/json'});return Response.json(report());});assert.equal(r.label,'Low Risk');});
test('one malicious detection gets a high score, matching extension',async()=>{const r=await checkWebsite('example.com',async()=>Response.json(report(1)));assert.equal(r.label,'High Risk');assert.equal(r.score,70);});
test('stale or empty clean reports are Unknown',async()=>{for(const body of [report(0,1),{attributes:null},{attributes:{last_analysis_stats:{malicious:0,suspicious:0,harmless:0,undetected:0}}}]){assert.equal((await checkWebsite('example.com',async()=>Response.json(body))).score,null);}});
test('inactive service, busy service, non JSON and network errors are surfaced',async()=>{for(const status of [503,429])await assert.rejects(checkWebsite('example.com',async()=>Response.json({error:'Please try again later.'},{status})),/Please try again/);await assert.rejects(checkWebsite('example.com',async()=>new Response('<html>error</html>')),/temporarily unavailable/);await assert.rejects(checkWebsite('example.com',async()=>{throw Error('offline');}),/connection/);});
test('blank and unsafe inputs fail before sending a request',async()=>{for(const input of ['', 'javascript:alert(1)','http://localhost'])await assert.rejects(checkWebsite(input,()=>{assert.fail('must not fetch');}));});
