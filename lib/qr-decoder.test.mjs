import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {normalize} from '../extension/core.mjs';

// Fixed QR matrices generated with qrcode 1.5.4, error correction M.
// Rasterize locally so tests exercise the shipped decoder without dependencies.
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/qr-matrices.json',import.meta.url)));
function raster(fixture,scale=6,inverted=false){
 const width=(fixture.size+8)*scale,data=new Uint8ClampedArray(width*width*4);
 for(let y=0;y<width;y++)for(let x=0;x<width;x++){
  const column=Math.floor(x/scale)-4,row=Math.floor(y/scale)-4;
  const dark=column>=0&&row>=0&&column<fixture.size&&row<fixture.size&&fixture.modules[row*fixture.size+column];
  const value=(inverted?!dark:dark)?0:255,offset=(y*width+x)*4;
  data.set([value,value,value,255],offset);
 }
 return {data,width};
}
for(const path of ['../public/jsQR.js','../extension/vendor/jsQR.js']){
 const context={};vm.runInNewContext(readFileSync(new URL(path,import.meta.url),'utf8'),context);
 test(`${path}: normal and inverted QR images decode to the destination for review`,()=>{
  for(const scale of [3,6])for(const inverted of [false,true]){
   const {data,width}=raster(fixtures[0],scale,inverted);
   const decoded=context.jsQR(data,width,width,{inversionAttempts:'attemptBoth'});
   assert.equal(decoded?.data,fixtures[0].text);
   assert.equal(normalize(decoded.data),'https://example.com/');
  }
 });
 test(`${path}: executable QR content is decoded but rejected as a website link`,()=>{
  const {data,width}=raster(fixtures[1]);
  const decoded=context.jsQR(data,width,width,{inversionAttempts:'attemptBoth'});
  assert.equal(decoded?.data,fixtures[1].text);assert.throws(()=>normalize(decoded.data));
 });
 test(`${path}: an image without a QR code has no destination`,()=>{
  const data=new Uint8ClampedArray(100*100*4).fill(255);
  assert.equal(context.jsQR(data,100,100,{inversionAttempts:'attemptBoth'}),null);
 });
}
