'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowRight,Camera,Link as LinkIcon,LoaderCircle,ShieldCheck,ShieldAlert,HelpCircle,Upload,Square,AlertTriangle} from 'lucide-react';
import {normalize,type RiskResult} from '../extension/core.mjs';
import {checkWebsite} from '../lib/web-check.mjs';
import {createWebScanner} from '../lib/web-scanner.mjs';

type Reader=(data:Uint8ClampedArray,width:number,height:number,options:unknown)=>{data:string}|null;
let decoderPromise:Promise<Reader>|null=null;
function getDecoder():Promise<Reader>{
 const current=(globalThis as typeof globalThis & {jsQR?:Reader}).jsQR;
 if(current)return Promise.resolve(current);
 if(decoderPromise)return decoderPromise;
 decoderPromise=new Promise<Reader>((resolve,reject)=>{
  const script=document.createElement('script');script.src='/jsQR.js';script.async=true;
  const deadline=setTimeout(()=>{script.remove();reject(Error('QR scanner could not load. Check your connection and try again.'));},15000);
  script.onload=()=>{clearTimeout(deadline);const reader=(globalThis as typeof globalThis & {jsQR?:Reader}).jsQR;reader?resolve(reader):reject(Error('QR scanner could not load. Please reload the page.'));};
  script.onerror=()=>{clearTimeout(deadline);script.remove();reject(Error('QR scanner could not load. Check your connection and try again.'));};
  document.head.appendChild(script);
 }).catch(e=>{decoderPromise=null;throw e;});
 return decoderPromise;
}
async function decodeImage(source:CanvasImageSource,width:number,height:number){
 const reader=await getDecoder(),canvas=document.createElement('canvas');
 const scale=Math.min(1,1200/Math.max(width,height));
 canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Image reader is unavailable.');
 ctx.drawImage(source,0,0,canvas.width,canvas.height);
 return reader(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,{inversionAttempts:'attemptBoth'})?.data??null;
}
export default function WebsiteCheck(){
 const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[reading,setReading]=useState(false);
 const [message,setMessage]=useState(''),[result,setResult]=useState<(RiskResult&{url:string})|null>(null);
 const [cameraState,setCameraState]=useState<'idle'|'starting'|'running'>('idle'),[cameraMessage,setCameraMessage]=useState(''),[mobile,setMobile]=useState(false);
 const video=useRef<HTMLVideoElement>(null),input=useRef<HTMLInputElement>(null),feedback=useRef<HTMLDivElement>(null);
 const scanner=useRef<ReturnType<typeof createWebScanner>|null>(null),controller=useRef<AbortController|null>(null),imageRun=useRef(0),checking=useRef(false);
 useEffect(()=>{
  const media=matchMedia('(pointer: coarse)');
  const detect=()=>setMobile(media.matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  queueMicrotask(detect);media.addEventListener('change',detect);
  scanner.current=createWebScanner({video:video.current!,getStream:()=>{
   if(!navigator.mediaDevices?.getUserMedia)return Promise.reject(Error('Camera is unavailable. Open this page directly in Safari or Chrome, or upload an image.'));
   return navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
  },decode:async v=>v.videoWidth?decodeImage(v,v.videoWidth,v.videoHeight):null,
  onState:(state,text)=>{setCameraState(state);setCameraMessage(text);},onCode:raw=>{
   setResult(null);try{setUrl(normalize(raw));setMessage('QR code read. Review the URL, then tap Check link.');input.current?.focus();}
   catch{setUrl('');setMessage('This QR code does not contain a public website link.');}
  }});
  const hidden=()=>{if(document.hidden){scanner.current?.stop('Camera stopped because you left the page.');imageRun.current++;setReading(false);}};
  const leave=()=>scanner.current?.stop();document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);
  return()=>{media.removeEventListener('change',detect);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);scanner.current?.stop('',false);scanner.current=null;imageRun.current++;controller.current?.abort();};
 },[]);
 useEffect(()=>{if(message||result)feedback.current?.focus({preventScroll:true});},[message,result]);
 async function check(event:FormEvent){
  event.preventDefault();if(checking.current)return;checking.current=true;
  scanner.current?.stop();imageRun.current++;setReading(false);setResult(null);setMessage('');setBusy(true);
  const request=new AbortController();controller.current=request;const timeout=setTimeout(()=>request.abort(),20000);
  try{const answer=await checkWebsite(url,fetch,request.signal);if(!request.signal.aborted){setUrl(answer.url);setResult(answer);}}
  catch(e){setMessage(e instanceof Error?e.message:'Could not complete the check. Please try again.');}
  finally{clearTimeout(timeout);checking.current=false;setBusy(false);controller.current=null;}
 }
 async function readFile(file:File){
  scanner.current?.stop();const run=++imageRun.current;setReading(true);setUrl('');setResult(null);setMessage('Reading QR image…');
  let objectURL:string|undefined;
  try{
   if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw Error('Choose a PNG, JPG or WebP image smaller than 10 MB.');
   const image=new Image();objectURL=URL.createObjectURL(file);image.src=objectURL;await image.decode();
   if(image.naturalWidth*image.naturalHeight>40000000)throw Error('This image is too large. Crop it around the QR code and try again.');
   const code=await decodeImage(image,image.naturalWidth,image.naturalHeight);
   if(run!==imageRun.current)return;if(!code)throw Error('No QR code found. Try a clear, cropped image of one code.');
   setUrl(normalize(code));setMessage('QR image read. Review the URL, then tap Check link.');input.current?.focus();
  }catch(e){if(run===imageRun.current)setMessage(e instanceof Error?e.message:'Could not read this image.');}
  finally{if(objectURL)URL.revokeObjectURL(objectURL);if(run===imageRun.current)setReading(false);}
 }
 return <section className="live-check section-wrap" id="check">
  <div className="live-check-intro"><span className="eyebrow">CHECK A LINK</span><h2>See where<br/><span>that link goes.</span></h2><p>Paste a link from a message, email or QR code. Check the warning signs before you open it.</p><div className="live-badges"><span><ShieldCheck size={14}/>No account needed</span><span><Camera size={14}/>QR images stay on your device</span></div></div>
  <div className="checker-card">
   <form onSubmit={check} noValidate><label htmlFor="website-url">Website link</label><div className="url-entry"><LinkIcon size={17}/><input ref={input} id="website-url" name="url" value={url} disabled={busy||reading} onChange={e=>{setUrl(e.target.value);setMessage('');setResult(null);}} placeholder="example.com or https://example.com" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={8192}/><button type="submit" disabled={busy||reading}>{busy?<LoaderCircle className="spin" size={17}/>:<ArrowRight size={17}/>}<span>{busy?'Checking…':'Check link'}</span></button></div><p className="checker-hint">Checking sends this URL to Linklight and an external security service. Avoid private links or links with passwords.</p></form>
   <div ref={feedback} tabIndex={-1} className="check-feedback" aria-live="polite" aria-busy={busy}>
    {busy&&<p className="check-progress" role="status"><LoaderCircle className="spin" size={16}/>Looking for a security report…</p>}
    {message&&<div className="checker-error" role="status"><AlertTriangle size={16}/><span>{message}</span></div>}
    {result&&<div className={`website-result ${result.tone}`}><div className="website-result-top"><span className="result-shield">{result.tone==='low'?<ShieldCheck/>:result.tone==='unknown'?<HelpCircle/>:<ShieldAlert/>}</span><div><span className="result-eyebrow">CHECK RESULT</span><h3>{result.label}</h3></div><strong>{result.score??'?'}<small>{result.score===null?'NOT RATED':'/ 100 RISK'}</small></strong></div><p className="checked-url">{result.url}</p><div className="website-risk-track"><span style={{width:`${result.score??0}%`}}/></div><b>{result.summary}</b>{result.notes.length>0&&<ul>{result.notes.map(note=><li key={note}>{note}</li>)}</ul>}<p>{result.evidence}</p><p>This score summarizes warning signs. It is not a probability.</p></div>}
   </div>
   <div className="phone-qr website-qr"><div className="phone-qr-top"><span><Camera size={16}/>Have a QR code?</span></div>
    <div className="camera-view" hidden={cameraState==='idle'}><video ref={video} muted playsInline autoPlay aria-label="Live rear camera preview"/><div className="camera-corners" aria-hidden="true"/>{cameraState==='starting'&&<span className="camera-loading">Waiting for camera access…</span>}<button type="button" onClick={()=>scanner.current?.stop()}><Square size={13}/>Stop camera</button></div>
    {mobile&&cameraState==='idle'&&<button type="button" className="camera-start" disabled={busy||reading} onClick={()=>{setMessage('');setResult(null);void scanner.current?.start();}}><span className="camera-icon"><Camera size={23}/></span><span><strong>Scan QR code</strong><small>Allow camera access if your browser asks</small></span><ArrowRight size={17}/></button>}
    {!mobile&&<p className="checker-hint">Open this website on your phone to scan with its camera, or upload a QR image here.</p>}
    <p className="camera-message" role="status">{cameraMessage}</p>
    <label className="upload-link"><Upload size={14}/><span>{reading?'Reading image…':'Upload a QR image'}</span><input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy||reading} onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void readFile(file);}}/></label>
   </div>
   <p className="website-disclaimer">Automated checks can make mistakes. Low risk does not guarantee safety.</p>
  </div>
 </section>;
}
