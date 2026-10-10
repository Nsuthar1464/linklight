import {createCameraScanner} from './camera.mjs';
import {normalize,assess,lookup} from './core.mjs';
const $=id=>document.getElementById(id);let busy=false,resultTimer=null;
function hideResult(){clearTimeout(resultTimer);$('result').hidden=true;$('advisory').hidden=true;}
function showAdvisory(r){$('advisory').replaceChildren();for(const [index,link] of (r.links??[]).entries()){if(index)$('advisory').append(' · ');const a=document.createElement('a');a.textContent=link.label;a.href=link.href;a.target='_blank';a.rel='noopener noreferrer';$('advisory').append(a);}$('advisory').hidden=!r.links?.length;if(r.googleExpiresAt)resultTimer=setTimeout(()=>{hideResult();message('This result expired. Check the link again.');},Math.max(0,r.googleExpiresAt-Date.now()));}
const message=t=>$('message').textContent=t;
function tab(qr){document.body.classList.toggle('qr-mode',qr);if(!qr)camera.stop();$('qrPanel').hidden=!qr;for(const [id,selected] of [['urlTab',!qr],['qrTab',qr]])$(id).setAttribute('aria-selected',String(selected));}
$('urlTab').onclick=()=>tab(false);$('qrTab').onclick=()=>{if(busy)return;tab(true);hideResult();message('');camera.start();};
for(const id of ['urlTab','qrTab'])$(id).onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const qr=id==='urlTab';tab(qr);$(qr?'qrTab':'urlTab').focus();}};
$('url').oninput=()=>{hideResult();message('');};
$('qrFile').onchange=async()=>{const file=$('qrFile').files[0];if(!file||busy)return;camera.stop();busy=true;for(const id of ['check','url','qrFile'])$(id).disabled=true;hideResult();message('Reading QR image…');let bitmap;
try{if(file.size>10*1024*1024)throw Error('Choose an image smaller than 10 MB.');if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose a PNG, JPG or WebP image.');bitmap=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);const code=window.jsQR(pixels.data,canvas.width,canvas.height,{inversionAttempts:'attemptBoth'});if(!code)throw Error('No QR code found. Try a clear, cropped image of one QR code.');$('url').value=normalize(code.data);message('QR code read. Review the destination, then choose Check destination.');}catch(e){$('url').value='';message(e.message||'This image could not be read. Try another image.');}finally{bitmap?.close();$('qrFile').value='';busy=false;for(const id of ['check','url','qrFile'])$(id).disabled=false;}};
$('checkForm').onsubmit=async e=>{e.preventDefault();if(busy)return;camera.stop();hideResult();
try{const url=normalize($('url').value);$('url').value=url;busy=true;for(const id of ['check','url','qrFile'])$(id).disabled=true;$('check').textContent='Checking…';message('Looking up the latest available report…');const a=await lookup(url);const r=assess(url,a);$('result').dataset.tone=r.tone;$('riskLabel').textContent=r.label;$('score').textContent=r.score??'—';$('scoreUnit').textContent=r.score===null?'not rated':'/ 100 risk';$('domain').textContent=new URL(url).hostname;$('summary').textContent=r.summary;$('evidence').textContent=r.evidence;$('reasons').replaceChildren(...r.notes.map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));$('result').hidden=false;showAdvisory(r);message('');}catch(e){message(e.message||'Something went wrong. Please try again.');}finally{busy=false;for(const id of ['check','url','qrFile'])$(id).disabled=false;$('check').textContent='Check destination →';}};

const camera=createCameraScanner({video:$('cameraVideo'),status:$('cameraStatus'),startButton:$('startCamera'),stopButton:$('stopCamera'),onCode(raw){
 hideResult();
 try{$('url').value=normalize(raw);message('QR code read. Review the destination, then choose Check destination.');$('url').focus();}
 catch(e){$('url').value='';message(e.message);}
}});
$('startCamera').onclick=()=>{if(!busy){hideResult();message('');camera.start();}};
$('stopCamera').onclick=()=>camera.stop();
window.addEventListener('pagehide',()=>camera.stop());
document.addEventListener('visibilitychange',()=>{if(document.hidden)camera.stop();});

$('enableCamera').onclick=async()=>{camera.stop();try{await chrome.windows.create({url:chrome.runtime.getURL('camera-permission.html'),type:'popup',width:460,height:540,focused:true});}catch{message('Could not open camera setup. Reload Linklight and try again.');}};
