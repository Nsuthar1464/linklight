'use client';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {Check,TriangleAlert,ShieldAlert,ScanSearch} from 'lucide-react';
import './verdict-lens.css';

// Illustrative examples only; the live checker below uses real provider results.
const samples=[
 {url:'youtube.com',level:'low',label:'Low Risk',score:6,note:'No warnings from any source.',src:['clear','clear','clear']},
 {url:'bit.ly/claim-your-prize',level:'medium',label:'Medium Risk',score:46,note:'Link shortener hides the destination.',src:['clear','clear','warn']},
 {url:'paypa1-secure-login.example',level:'high',label:'High Risk',score:97,note:'Listed as a phishing site.',src:['bad','bad','warn']}
] as const;
const sources=['Google Safe Browsing','VirusTotal','URLhaus'];

export default function VerdictLens({motion}:{motion:boolean}){
 const [idx,setIdx]=useState(0),[done,setDone]=useState(!motion),[hold,setHold]=useState(false);
 const card=useRef<HTMLDivElement>(null),frame=useRef(0);
 const s=samples[idx];
 const shown=!motion||done;
 const go=(i:number)=>{setIdx(i);setDone(false);};
 // Scan for a moment, then reveal the verdict. A pick restarts the scan from wherever it is.
 useEffect(()=>{
  if(!motion)return;
  const t=setTimeout(()=>setDone(true),1500);return()=>clearTimeout(t);
 },[idx,motion]);
 useEffect(()=>{
  if(!motion||hold||!done)return;
  const t=setTimeout(()=>{setIdx(i=>(i+1)%samples.length);setDone(false);},4200);return()=>clearTimeout(t);
 },[idx,done,motion,hold]);
 function move(e:PointerEvent<HTMLDivElement>){
  const el=card.current;if(!el||e.pointerType==='touch')return;
  const b=el.getBoundingClientRect(),x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;
  cancelAnimationFrame(frame.current);
  frame.current=requestAnimationFrame(()=>{el.style.setProperty('--mx',`${x*100}%`);el.style.setProperty('--my',`${y*100}%`);if(motion){el.style.setProperty('--rx',`${(.5-y)*6}deg`);el.style.setProperty('--ry',`${(x-.5)*8}deg`);}});
 }
 function leave(){cancelAnimationFrame(frame.current);setHold(false);const el=card.current;if(el){el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg');}}
 const Icon=s.level==='low'?Check:s.level==='medium'?TriangleAlert:ShieldAlert;
 const C=2*Math.PI*54,offset=shown?C*(1-s.score/100):C;
 return <div className="lens-wrap" onPointerMove={move} onPointerEnter={()=>setHold(true)} onPointerLeave={leave}>
  <div className={`lens lens-${s.level} ${shown?'is-done':'is-scanning'}`} ref={card} role="group" aria-label="Example of a Linklight result">
   <div className="lens-spot" aria-hidden="true"/>
   <div className="lens-top"><span className="lens-dots" aria-hidden="true"><i/><i/><i/></span><span className="lens-badge">EXAMPLE RESULT</span></div>
   <div className="lens-url"><ScanSearch size={16} aria-hidden="true"/><span key={idx} className="lens-url-text">{s.url}</span><span className="lens-beam" aria-hidden="true"/></div>
   <div className="lens-body">
    <div className="lens-gauge" aria-hidden="true">
     <svg viewBox="0 0 120 120"><circle className="g-track" cx="60" cy="60" r="54"/><circle className="g-fill" cx="60" cy="60" r="54" strokeDasharray={C} strokeDashoffset={offset} transform="rotate(-90 60 60)"/></svg>
     <div className="g-center"><Icon size={34} strokeWidth={2.2}/></div>
    </div>
    <div className="lens-verdict" aria-live="polite">
     <span className="lens-label">{shown?s.label:'Checking…'}</span>
     <span className="lens-note">{shown?s.note:'Asking three security sources'}</span>
    </div>
   </div>
   <ul className="lens-sources">{sources.map((n,i)=><li key={n} className={shown?`src-${s.src[i]}`:''} style={{transitionDelay:shown?`${120+i*90}ms`:'0ms'}}><span className="src-dot" aria-hidden="true"/>{n}<em>{shown?(s.src[i]==='clear'?'Clear':s.src[i]==='warn'?'Warning':'Listed'):'…'}</em></li>)}</ul>
  </div>
  <div className="lens-picks" role="group" aria-label="Try an example">{samples.map((x,i)=><button key={x.level} className={`pick pick-${x.level}`+(i===idx?' on':'')} aria-pressed={i===idx} onClick={()=>{go(i);setHold(true)}}><i aria-hidden="true"/>{x.label.replace(' Risk','')}</button>)}</div>
  <p className="lens-foot">Illustrative examples. Paste your own link below to get a real result.</p>
 </div>;
}
