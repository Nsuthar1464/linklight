const $=id=>document.getElementById(id);let stream=null,closed=false;
const stop=()=>{stream?.getTracks().forEach(t=>t.stop());stream=null;};
window.addEventListener('pagehide',()=>{closed=true;stop();});
$('allow').onclick=async()=>{
 $('allow').disabled=true;$('help').hidden=true;$('status').textContent='Waiting for Chrome. Choose Allow in the camera prompt.';
 try{
  const next=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
  if(closed){next.getTracks().forEach(t=>t.stop());return;}
  stream=next;stop();$('status').textContent='Camera access works. Close this window, reopen Linklight from the toolbar and choose QR code.';$('close').hidden=false;$('close').textContent='Done — close setup';
 }catch(e){
  $('help').hidden=false;$('status').textContent=e.name==='NotAllowedError'?'Camera access is blocked or was dismissed. Follow the steps below, then try again.':e.name==='NotFoundError'?'No camera was found. Connect a camera and try again.':e.name==='NotReadableError'?'The camera is busy or blocked by your computer. Close other camera apps and check Mac camera settings.':'Could not access the camera. Check the settings below and try again.';
 }finally{$('allow').disabled=false;}
};
$('settings').onclick=async()=>{try{await chrome.tabs.create({url:'chrome://settings/content/camera'});}catch{$('status').textContent='Type chrome://settings/content/camera into Chrome’s address bar to review camera permissions.';}};
$('close').onclick=()=>window.close();
