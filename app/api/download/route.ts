import {extensionZipBase64} from '../../../lib/extension-download-data';

export function GET(){
 const bytes=Uint8Array.from(atob(extensionZipBase64),character=>character.charCodeAt(0));
 return new Response(bytes,{headers:{
  'Content-Type':'application/zip',
  'Content-Disposition':'attachment; filename="Linklight.zip"',
  'Content-Length':String(bytes.byteLength),
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff'
 }});
}
