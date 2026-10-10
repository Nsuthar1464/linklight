// The video element must stay mounted while permissions are pending.
export function createWebScanner({video, getStream, decode, onState, onCode, schedule=setTimeout, cancel=clearTimeout}) {
 let stream=null, generation=0, active=false, frame=null, deadline=null;
 function stop(message='Camera stopped.', notify=true) {
  generation++; active=false; cancel(frame); cancel(deadline);
  stream?.getTracks().forEach(t=>t.stop()); stream=null;
  video.pause(); video.srcObject=null;
  if(notify)onState('idle',message);
 }
 async function start() {
  if(active)return;
  active=true; const run=++generation;
  onState('starting','Allow camera access if your browser asks.');
  deadline=schedule(()=>{if(run===generation)stop('Camera request timed out. Tap Scan QR code to try again.');},30000);
  try {
   const next=await getStream();
   if(run!==generation){next.getTracks().forEach(t=>t.stop());return;}
   stream=next;video.srcObject=next;video.muted=true;video.playsInline=true;
   await video.play();if(run!==generation)return;
   cancel(deadline);onState('running','Point the rear camera at one QR code.');
   stream.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{if(run===generation)stop('Camera disconnected. Try again.');}));
   deadline=schedule(()=>{if(run===generation)stop('No code found in 60 seconds. Try better lighting or upload an image.');},60000);
   async function scan(){
    if(run!==generation)return;
    try {
     const raw=video.readyState>=2?await decode(video):null;
     if(run!==generation)return;
     if(raw){stop('QR code captured. Camera turned off.');onCode(raw);return;}
     frame=schedule(scan,250);
    }catch{if(run===generation)stop('Could not read the camera image. Try again or upload a QR image.');}
   }
   void scan();
  }catch(e){if(run!==generation)return;
   const errors={NotAllowedError:'Camera permission was blocked. Allow Camera in this website’s browser settings, then try again.',NotFoundError:'No camera found. Upload a QR image instead.',NotReadableError:'Camera is busy. Close other camera apps and try again.'};
   stop(errors[e?.name]||e?.message||'Camera could not start. Try uploading an image.');
  }
 }
 return {start,stop};
}
