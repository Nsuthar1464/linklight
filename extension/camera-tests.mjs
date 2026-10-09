import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCameraScanner} from './camera.mjs';
function setup(getUserMedia,code=null){
 globalThis.document={createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(4)})})})};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia}}});
 globalThis.jsQR=()=>code;
 const video={pause(){},play:async()=>{},readyState:2,videoWidth:640,videoHeight:480,srcObject:null};
 const status={},startButton={},stopButton={};let found;
 const scanner=createCameraScanner({video,status,startButton,stopButton,onCode:raw=>found=raw});
 return {scanner,video,status,startButton,stopButton,get found(){return found}};
}
function media(){const track={stopped:false,stop(){this.stopped=true},addEventListener(){}};return {track,stream:{getTracks:()=>[track],getVideoTracks:()=>[track]}};}
test('camera QR decoded locally; track stops before result',async()=>{const m=media();const t=setup(async opts=>{assert.equal(opts.audio,false);assert.equal(opts.video.facingMode,'user');return m.stream},{data:'https://example.com'});await t.scanner.start();assert.equal(t.found,'https://example.com');assert.equal(m.track.stopped,true);assert.equal(t.video.srcObject,null);assert.equal(t.startButton.disabled,false)});
test('permission denial gives recovery instructions',async()=>{const t=setup(async()=>{throw Object.assign(Error(),{name:'NotAllowedError'})});await t.scanner.start();assert.match(t.status.textContent,/blocked/);assert.equal(t.startButton.disabled,false)});
test('stop during pending permission releases late stream',async()=>{const m=media();let resolve;const t=setup(()=>new Promise(r=>resolve=r));const start=t.scanner.start();t.scanner.stop();resolve(m.stream);await start;assert.equal(m.track.stopped,true);assert.equal(t.video.srcObject,null)});
test('repeat start cannot open concurrent cameras; manual stop cleans up',async()=>{const m=media();let calls=0;const t=setup(async()=>{calls++;return m.stream});await t.scanner.start();await t.scanner.start();assert.equal(calls,1);t.scanner.stop();assert.equal(m.track.stopped,true);assert.equal(t.stopButton.hidden,true)});
