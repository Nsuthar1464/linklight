export function createCameraScanner({video,status,startButton,stopButton,onCode}) {
 let stream=null,timer=null,deadline=null,generation=0,active=false;
 const canvas=document.createElement('canvas');
 const context=canvas.getContext('2d',{willReadFrequently:true});
 function stop(text='Camera stopped. Choose Start camera to scan again.') {
  generation++;active=false;clearTimeout(timer);clearTimeout(deadline);
  stream?.getTracks().forEach(track=>track.stop());stream=null;
  video.pause();video.srcObject=null;startButton.disabled=false;stopButton.hidden=true;
  status.textContent=text;
 }
 async function start(){
  if(active)return;active=true;const run=++generation;
  startButton.disabled=true;stopButton.hidden=false;status.textContent='Allow camera access when Chrome asks.';
  deadline=setTimeout(()=>{if(run===generation)stop('Camera request timed out. Try again and allow camera access.');},30000);
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access is unavailable. Open Linklight from the Chrome toolbar.');
   const next=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}}});
   if(run!==generation){next.getTracks().forEach(track=>track.stop());return;}
   stream=next;stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(run===generation)stop('Camera disconnected. Reconnect it, then try again.');}));
   video.srcObject=stream;await video.play();if(run!==generation)return;clearTimeout(deadline);
   status.textContent='Camera is on. Hold your phone’s QR code steady inside the preview.';
   deadline=setTimeout(()=>stop('No QR code found in 60 seconds. Improve the lighting or move your phone, then try again.'),60000);
   function scan(){
    if(run!==generation)return;
    try{
     if(video.readyState>=2&&video.videoWidth){
      const scale=Math.min(1,960/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
      context.drawImage(video,0,0,canvas.width,canvas.height);
      const pixels=context.getImageData(0,0,canvas.width,canvas.height);
      const code=globalThis.jsQR(pixels.data,canvas.width,canvas.height,{inversionAttempts:'attemptBoth'});
      if(code){stop('QR code captured. Camera turned off.');onCode(code.data);return;}
     }
     timer=setTimeout(scan,200);
    }catch{stop('The camera image could not be read. Try again or upload a QR image.');}
   }
   scan();
  }catch(e){
   if(run!==generation)return;
   const errors={NotAllowedError:'Camera access was blocked. Click Enable camera access below to open the permission setup. On Mac, also check System Settings → Privacy & Security → Camera → Google Chrome.',NotFoundError:'No camera was found. Connect a webcam or upload a QR image.',NotReadableError:'The camera is busy or unavailable. Close other camera apps and try again.',OverconstrainedError:'This camera could not start. Try another camera or upload a QR image.'};
   stop(errors[e.name]||e.message||'Could not start the camera. Try again or upload an image.');
  }
 }
 return {start,stop};
}
